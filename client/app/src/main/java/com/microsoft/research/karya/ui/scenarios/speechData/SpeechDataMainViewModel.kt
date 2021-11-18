package com.microsoft.research.karya.ui.scenarios.speechData

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.*
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.RawToAACEncoder
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.android.synthetic.main.microtask_speech_data.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import java.io.DataOutputStream
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.lang.Runnable
import java.lang.Thread
import java.util.*
import javax.inject.Inject
import kotlin.collections.ArrayList

/** Audio recording parameters */
private const val AUDIO_CHANNEL = AudioFormat.CHANNEL_IN_MONO

@HiltViewModel
class SpeechDataMainViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
  private val datastore: DataStore<Preferences>
) : BaseMTRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager
) {

  // TODO: Pass it in constructor (once we have viewModel factory)
  private val postRecordingTime: Int = 250
  private val prerecordingTime: Int = 250

  // Speech data collection parameters
  private var samplingRate: Int = 44100
  private var audioEncoding: Int = AudioFormat.ENCODING_PCM_16BIT
  private var compressAudio: Boolean = true

  /**
   * UI button states
   *
   * [DISABLED]: Greyed out. Cannot click [ENABLED]: Can click [ACTIVE]: Red color. Can click
   */
  enum class ButtonState {
    DISABLED,
    ENABLED,
    ACTIVE
  }

  /** Activity states */
  enum class ActivityState {
    INIT,
    PRERECORDING,
    COMPLETED_PRERECORDING,
    RECORDING,
    RECORDED,
    FIRST_PLAYBACK,
    FIRST_PLAYBACK_PAUSED,
    COMPLETED,
    OLD_PLAYING,
    OLD_PAUSED,
    NEW_PLAYING,
    NEW_PAUSED,
    ENCODING_BACK,
    ENCODING_NEXT,
    SIMPLE_BACK,
    SIMPLE_NEXT,
    ASSISTANT_PLAYING,
    ACTIVITY_STOPPED,
  }

  /** UI strings */
  private var noForcedReplay: Boolean = false

  /** Audio recorder and media player */
  private var audioRecorder: AudioRecord? = null
  private var mediaPlayer: MediaPlayer? = null

  /** Audio recorder config parameters */
  private val _minBufferSize =
    AudioRecord.getMinBufferSize(samplingRate, AUDIO_CHANNEL, audioEncoding)
  private val _recorderBufferSize = _minBufferSize * 4
  private val _recorderBufferBytes = _recorderBufferSize

  /** UI State */
  @JvmField
  var activityState: ActivityState = ActivityState.INIT
  var previousActivityState: ActivityState = ActivityState.INIT

  private val _recordBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val recordBtnState = _recordBtnState.asStateFlow()

  private val _playBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val playBtnState = _playBtnState.asStateFlow()

  private val _nextBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val nextBtnState = _nextBtnState.asStateFlow()

  private val _backBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val backBtnState = _backBtnState.asStateFlow()

  private val _playRecordPromptTrigger: MutableStateFlow<Boolean> = MutableStateFlow(false)
  val playRecordPromptTrigger = _playRecordPromptTrigger.asStateFlow()

  private val _sentenceTvText: MutableStateFlow<String> = MutableStateFlow("")
  val sentenceTvText = _sentenceTvText.asStateFlow()

  private val _recordSecondsTvText: MutableStateFlow<String> = MutableStateFlow("")
  val recordSecondsTvText = _recordSecondsTvText.asStateFlow()

  private val _recordCentiSecondsTvText: MutableStateFlow<String> = MutableStateFlow("")
  val recordCentiSecondsTvText = _recordCentiSecondsTvText.asStateFlow()

  private val _playbackProgressPbProgress: MutableStateFlow<Int> = MutableStateFlow(0)
  val playbackProgressPb = _playbackProgressPbProgress.asStateFlow()

  private val _playbackProgressPbMax: MutableStateFlow<Int> = MutableStateFlow(0)
  val playbackProgressPbMax = _playbackProgressPbMax.asStateFlow()

  /** Recording config and state */
  private val maxPreRecordBytes = timeToSamples(prerecordingTime) * 2

  private var preRecordBuffer: Array<ByteArray>
  var preRecordBufferConsumed: Array<Int> = Array(2) { 0 }
  private var currentPreRecordBufferIndex = 0
  private var totalRecordedBytes = 0
  var preRecordingJob: Job? = null

  private var recordBuffers: ArrayList<ByteArray> = arrayListOf()
  private var currentRecordBufferConsumed = 0
  private var recordingJob: Job? = null
  private var audioFileFlushJob: Job? = null

  /** scratch WAV file */
  private val scratchRecordingFileParams = Pair("", "wav")
  private lateinit var scratchRecordingFilePath: String
  private lateinit var scratchRecordingFile: DataOutputStream
  private lateinit var scratchRecordingFileInitJob: Job

  /** Final recording file */
  private val outputRecordingFileParams = Pair("", "m4a")
  private lateinit var outputRecordingFilePath: String
  private var encodingJob: Job? = null

  /** Playback progress thread */
  private var playbackProgressThread: Thread? = null

  private var firstTimeActivityVisit: Boolean = true

  init {
    /** setup [preRecordBuffer] */
    preRecordBuffer = Array(2) { ByteArray(maxPreRecordBytes) }

    runBlocking {
      val firstRunKey = booleanPreferencesKey(PreferenceKeys.SPEECH_DATA_ACTIVITY_VISITED)
      val data = datastore.data.first()
      firstTimeActivityVisit = data[firstRunKey] ?: true
      datastore.edit { prefs -> prefs[firstRunKey] = false }
    }
  }

  /**
   * Initialize speech data collection parameters
   */
  fun setupSpeechDataViewModel() {
    compressAudio = try {
      task.params.asJsonObject.get("compress").asBoolean
    } catch (e: Exception) {
      true
    }

    samplingRate = try {
      val rate = task.params.asJsonObject.get("sampling_rate").asString
      when (rate) {
        "8k" -> 8000
        "16k" -> 16000
        "44k" -> 44100
        else -> 44100
      }
    } catch (e: Exception) {
      44100
    }

    audioEncoding = try {
      val bitwidth = task.params.asJsonObject.get("bitwidth").asString
      when (bitwidth) {
        "8" -> AudioFormat.ENCODING_PCM_8BIT
        "16" -> AudioFormat.ENCODING_PCM_16BIT
        else -> AudioFormat.ENCODING_PCM_16BIT
      }
    } catch (e: Exception) {
      AudioFormat.ENCODING_PCM_16BIT
    }
  }

  /** Shortcut to set and flush all four button states (in sequence) */
  private fun setButtonStates(b: ButtonState, r: ButtonState, p: ButtonState, n: ButtonState) {
    _backBtnState.value = b
    _recordBtnState.value = r
    _playBtnState.value = p
    _nextBtnState.value = n
  }

  override fun setupMicrotask() {

    /** Get the scratch and output file paths */
    scratchRecordingFilePath = getAssignmentScratchFilePath(scratchRecordingFileParams)
    outputRecordingFilePath =
      assignmentOutputContainer.getAssignmentOutputFilePath(
        microtaskAssignmentIDs[currentAssignmentIndex],
        outputRecordingFileParams
      )

    /** Write wav file */
    scratchRecordingFileInitJob = CoroutineScope(Dispatchers.IO).launch { resetWavFile() }

    // Reset progress bar
    _playbackProgressPbProgress.value = 0

    _sentenceTvText.value =
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").toString()
    totalRecordedBytes = 0

    if (firstTimeActivityVisit) {
      firstTimeActivityVisit = false
      onAssistantClick()
    } else {
      moveToPrerecording()
    }
  }

  /** Handle record button click */
  fun handleRecordClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "RECORD")
    message.addProperty("state", recordBtnState.toString())
    log(message)

    /** Determine action based on current state */
    when (activityState) {
      /**
       * Prerecording states: Set target button states. Wait for wave file init job and prerecording
       * job to finish. Write the prerecord buffer to wav file. Start regular recording.
       */
      ActivityState.PRERECORDING,
      ActivityState.COMPLETED_PRERECORDING -> {
        setButtonStates(DISABLED, ACTIVE, DISABLED, DISABLED)
        setActivityState(ActivityState.RECORDING)
      }

      /** COMPLETED: Just reset wav file and restart recording */
      ActivityState.COMPLETED -> {
        setButtonStates(DISABLED, ACTIVE, DISABLED, DISABLED)

        scratchRecordingFileInitJob = viewModelScope.launch(Dispatchers.IO) { resetWavFile() }

        totalRecordedBytes = 0
        setActivityState(ActivityState.RECORDING)
      }

      /** Media player states: Stop and release media player. Reset wav file. Restart recording. */
      ActivityState.OLD_PLAYING,
      ActivityState.OLD_PAUSED,
      ActivityState.NEW_PLAYING,
      ActivityState.NEW_PAUSED,
      -> {
        setButtonStates(DISABLED, ACTIVE, DISABLED, DISABLED)

        releasePlayer()
        scratchRecordingFileInitJob = viewModelScope.launch(Dispatchers.IO) { resetWavFile() }
        setActivityState(ActivityState.RECORDING)
      }

      /** RECORDING: Set target button states. Move to recorded state */
      ActivityState.RECORDING -> {
        setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)
        setActivityState(ActivityState.RECORDED)
      }

      /**
       * All other states: Record button is not clickable. This function should not have been
       * called. Throw an error.
       */
      ActivityState.INIT,
      ActivityState.RECORDED,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED,
      ActivityState.ENCODING_NEXT,
      ActivityState.ENCODING_BACK,
      ActivityState.SIMPLE_BACK,
      ActivityState.SIMPLE_NEXT,
      ActivityState.ASSISTANT_PLAYING,
      ActivityState.ACTIVITY_STOPPED,
      -> {
        // throw Exception("Record button should not be clicked in '$activityState' state")
      }
    }
  }

  /** Handle play button click */
  fun handlePlayClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "PLAY")
    message.addProperty("state", playBtnState.toString())
    log(message)

    when (activityState) {
      /** If coming from first play back, just move to pause */
      ActivityState.FIRST_PLAYBACK -> {
        setButtonStates(DISABLED, DISABLED, ENABLED, DISABLED)
        setActivityState(ActivityState.FIRST_PLAYBACK_PAUSED)
      }

      /** If coming from first playback paused, resume player */
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        setButtonStates(DISABLED, DISABLED, ACTIVE, DISABLED)
        setActivityState(ActivityState.FIRST_PLAYBACK)
      }

      /** If coming from completed, play the scratch wav file */
      ActivityState.COMPLETED -> {
        setButtonStates(ENABLED, ENABLED, ACTIVE, ENABLED)
        setActivityState(ActivityState.NEW_PLAYING)
      }

      /** on NEW_PLAYING, move to NEW_PAUSED */
      ActivityState.NEW_PLAYING -> {
        setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
        setActivityState(ActivityState.NEW_PAUSED)
      }

      /** on NEW_PAUSED, move to NEW_PLAYING */
      ActivityState.NEW_PAUSED -> {
        setButtonStates(ENABLED, ENABLED, ACTIVE, ENABLED)
        setActivityState(ActivityState.NEW_PLAYING)
      }

      /** COMPLETED_PRERECORDING: Move to old playing */
      ActivityState.COMPLETED_PRERECORDING -> {
        setButtonStates(ENABLED, ENABLED, ACTIVE, ENABLED)
        setActivityState(ActivityState.OLD_PLAYING)
      }

      /** OLD_PLAYING: Move to old paused */
      ActivityState.OLD_PLAYING -> {
        setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
        setActivityState(ActivityState.OLD_PAUSED)
      }

      /** OLD_PAUSED: Move to old playing */
      ActivityState.OLD_PAUSED -> {
        setButtonStates(ENABLED, ENABLED, ACTIVE, ENABLED)
        setActivityState(ActivityState.OLD_PLAYING)
      }
      ActivityState.INIT,
      ActivityState.PRERECORDING,
      ActivityState.RECORDED,
      ActivityState.RECORDING,
      ActivityState.ENCODING_BACK,
      ActivityState.ENCODING_NEXT,
      ActivityState.SIMPLE_BACK,
      ActivityState.SIMPLE_NEXT,
      ActivityState.ASSISTANT_PLAYING,
      ActivityState.ACTIVITY_STOPPED,
      -> {
        // throw Exception("Play button should not be clicked in '$activityState' state")
      }
    }
  }

  /** Handle next button click */
  fun handleNextClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    /** Disable all buttons when NEXT is clicked */
    setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)

    when (activityState) {
      ActivityState.COMPLETED_PRERECORDING, ActivityState.OLD_PLAYING, ActivityState.OLD_PAUSED -> {
        setActivityState(ActivityState.SIMPLE_NEXT)
      }
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED -> {
        setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)
        setActivityState(ActivityState.ENCODING_NEXT)
      }
      ActivityState.INIT,
      ActivityState.PRERECORDING,
      ActivityState.RECORDING,
      ActivityState.RECORDED,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED,
      ActivityState.ENCODING_NEXT,
      ActivityState.ENCODING_BACK,
      ActivityState.SIMPLE_NEXT,
      ActivityState.SIMPLE_BACK,
      ActivityState.ASSISTANT_PLAYING,
      ActivityState.ACTIVITY_STOPPED,
      -> {
        // throw Exception("Next button should not be clicked in '$activityState' state")
      }
    }
  }

  /** Handle back button click */
  fun handleBackClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "BACK")
    log(message)

    /** Disable all buttons when NEXT is clicked */
    setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)

    when (activityState) {
      ActivityState.PRERECORDING,
      ActivityState.COMPLETED_PRERECORDING,
      ActivityState.OLD_PLAYING,
      ActivityState.OLD_PAUSED,
      -> {
        setActivityState(ActivityState.SIMPLE_BACK)
      }
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED -> {
        setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)
        setActivityState(ActivityState.ENCODING_BACK)
      }
      ActivityState.INIT,
      ActivityState.RECORDING,
      ActivityState.RECORDED,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED,
      ActivityState.ENCODING_NEXT,
      ActivityState.ENCODING_BACK,
      ActivityState.SIMPLE_NEXT,
      ActivityState.SIMPLE_BACK,
      ActivityState.ASSISTANT_PLAYING,
      ActivityState.ACTIVITY_STOPPED,
      -> {
        // throw Exception("Back button should not be clicked in '$activityState' state")
      }
    }
  }

  fun onBackPressed() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "ANDROID_BACK")
    log(message)

    when (activityState) {
      ActivityState.INIT,
      ActivityState.RECORDED,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED,
      ActivityState.OLD_PLAYING,
      ActivityState.OLD_PAUSED,
      ActivityState.SIMPLE_NEXT,
      ActivityState.SIMPLE_BACK,
      ActivityState.ASSISTANT_PLAYING,
      -> {
        navigateBack()
      }

      ActivityState.PRERECORDING,
      ActivityState.COMPLETED_PRERECORDING -> {
        preRecordingJob?.cancel()
        releaseRecorder()
        navigateBack()
      }

      ActivityState.RECORDING -> {
        recordingJob?.cancel()
        releaseRecorder()
        navigateBack()
      }

      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED -> {
        runBlocking {
          encodeRecording()
          completeAndSaveCurrentMicrotask()
          navigateBack()
        }
      }
      ActivityState.ENCODING_NEXT, ActivityState.ENCODING_BACK -> {
        runBlocking {
          encodingJob?.join()
          navigateBack()
        }
      }
      ActivityState.ACTIVITY_STOPPED -> {
        //  throw Exception("Android back button cannot not be clicked in '$activityState' state")
      }
    }
  }

  /** On assistant click, take user through the recording process */
  fun onAssistantClick() {

    when (activityState) {
      ActivityState.INIT -> {
        viewModelScope.launch {
          delay(1000)
          playRecordPrompt()
        }
      }
      ActivityState.PRERECORDING, ActivityState.COMPLETED_PRERECORDING -> {
        runBlocking {
          setActivityState(ActivityState.ASSISTANT_PLAYING)
          preRecordingJob?.join()
          preRecordBufferConsumed[0] = 0
          preRecordBufferConsumed[1] = 0
          releaseRecorder()
          setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)
          playRecordPrompt()
        }
      }
      else -> {
      }
    }
  }

  private fun playRecordPrompt() {
    _playRecordPromptTrigger.value = true
  }

  /** Move from init to pre-recording */
  fun moveToPrerecording() {
    preRecordBufferConsumed[0] = 0
    preRecordBufferConsumed[1] = 0

    if (currentAssignment.status != MicrotaskAssignmentStatus.COMPLETED) {
      setButtonStates(ENABLED, ENABLED, DISABLED, DISABLED)
      setActivityState(ActivityState.PRERECORDING)
      resetRecordingLength()
    } else {
      setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)

      val mPlayer = MediaPlayer()
      mPlayer.setDataSource(outputRecordingFilePath)
      mPlayer.prepare()
      resetRecordingLength(mPlayer.duration)
      mPlayer.release()
      setActivityState(ActivityState.COMPLETED_PRERECORDING)
    }
  }

  /** Set the state of the activity to the target state */
  fun setActivityState(targetState: ActivityState) {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "->")
    message.addProperty("from", activityState.toString())
    message.addProperty("to", targetState.toString())
    log(message)

    // Switch states
    previousActivityState = activityState
    activityState = targetState

    // Handle state change
    when (activityState) {
      /**
       * INIT: release audio recorder and media player. May not be necessary? Microtask setup will
       * transition to next state
       */
      ActivityState.INIT -> {
        releasePlayer()
        releaseRecorder()
      }

      /** PRERECORDING: Create audio recorder and start prerecording */
      ActivityState.PRERECORDING -> {
        initializeAndStartRecorder()
        writeAudioDataToPrerecordBuffer()
      }

      /** COMPLETED_PRERECORDING: Create audio recorder and start prerecording */
      ActivityState.COMPLETED_PRERECORDING -> {
        initializeAndStartRecorder()
        writeAudioDataToPrerecordBuffer()
      }

      /**
       * RECORDING: If not coming from prerecording states, initialize the audio recorder and start
       * recording. Start chronometer. Write audio data to file.
       */
      ActivityState.RECORDING -> {
        if (!isPrerecordingState(previousActivityState)) initializeAndStartRecorder()
        _playbackProgressPbProgress.value = 0
        recordBuffers = arrayListOf()
        writeAudioDataToRecordBuffer()
      }

      /** RECORDED: Finish recording and finalize wav file. Switch to first play back */
      ActivityState.RECORDED -> {
        finishRecordingAndFinalizeWavFile()
      }

      /**
       * FIRST_PLAYBACK: Start media player and play the scratch wav file If coming from paused
       * state, resume player
       */
      ActivityState.FIRST_PLAYBACK -> {
        if (previousActivityState == ActivityState.RECORDED || previousActivityState == ActivityState.ACTIVITY_STOPPED
        ) {
          initializePlayer()
          mediaPlayer!!.setOnCompletionListener { setActivityState(ActivityState.COMPLETED) }
          playFile(scratchRecordingFilePath)
        } else if (previousActivityState == ActivityState.FIRST_PLAYBACK_PAUSED) {
          mediaPlayer!!.start()
        }
        updatePlaybackProgress(ActivityState.FIRST_PLAYBACK)
      }

      /** FIRST_PLAYBACK_PAUSED: Pause media player */
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        mediaPlayer!!.pause()
      }

      /** COMPLETED: release the media player */
      ActivityState.COMPLETED -> {
        playbackProgressThread?.join()
        setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
        _playbackProgressPbProgress.value = 0
        releasePlayer()
      }

      /**
       * NEW_PLAYING: if coming from paused state, start player. Else initialize and start the
       * player. Set the onCompletion listener to go back to the completed state
       */
      ActivityState.NEW_PLAYING -> {
        if (previousActivityState == ActivityState.NEW_PAUSED) {
          mediaPlayer!!.start()
        } else if (previousActivityState == ActivityState.COMPLETED) {
          initializePlayer()
          mediaPlayer!!.setOnCompletionListener {
            setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
            setActivityState(ActivityState.COMPLETED)
          }
          playFile(scratchRecordingFilePath)
        }
        updatePlaybackProgress(ActivityState.NEW_PLAYING)
      }

      /** NEW_PAUSED: pause the player */
      ActivityState.NEW_PAUSED -> {
        mediaPlayer!!.pause()
      }

      /**
       * OLD_PLAYING: if coming from paused state, start player. Else initialize and start the
       * player. Set the onCompletion listener to go back to the completed state. Play old output
       * file.
       */
      ActivityState.OLD_PLAYING -> {
        if (previousActivityState == ActivityState.OLD_PAUSED) {
          mediaPlayer!!.start()
        } else if (previousActivityState == ActivityState.COMPLETED_PRERECORDING) {
          initializePlayer()
          mediaPlayer!!.setOnCompletionListener {
            _playbackProgressPbProgress.value = _playbackProgressPbMax.value
            setButtonStates(
              ButtonState.ENABLED,
              ButtonState.ENABLED,
              ButtonState.ENABLED,
              ButtonState.ENABLED
            )
            setActivityState(ActivityState.COMPLETED_PRERECORDING)
          }
          playFile(outputRecordingFilePath)
        }
        updatePlaybackProgress(ActivityState.OLD_PLAYING)
      }

      /** OLD_PAUSED: pause the player */
      ActivityState.OLD_PAUSED -> {
        mediaPlayer!!.pause()
      }

      /**
       * SIMPLE_NEXT: If prerecording, then wait for prerecording job to finish. Then move to next
       * microtask
       */
      ActivityState.SIMPLE_NEXT -> {
        runBlocking {
          if (isPrerecordingState(previousActivityState)) {
            preRecordingJob?.join()
          }
          moveToNextMicrotask()
          setActivityState(ActivityState.INIT)
        }
      }

      /**
       * SIMPLE_BACK: If prerecording, then wait for prerecording job to finish. Then move to
       * previous microtask
       */
      ActivityState.SIMPLE_BACK -> {
        runBlocking {
          if (isPrerecordingState(previousActivityState)) {
            preRecordingJob?.join()
          }
          moveToPreviousMicrotask()
          setActivityState(ActivityState.INIT)
        }
      }

      /** ENCODING_NEXT: Encode scratch file to compressed output file. Move to next microtask. */
      ActivityState.ENCODING_NEXT -> {
        runBlocking {
          encodingJob =
            viewModelScope.launch(Dispatchers.IO) {
              encodeRecording()
              completeAndSaveCurrentMicrotask()
            }
          encodingJob?.join()
          moveToNextMicrotask()
          setActivityState(ActivityState.INIT)
        }
      }

      /**
       * ENCODING_BACK: Encode scratch file to compressed output file. Move to previous microtask.
       */
      ActivityState.ENCODING_BACK -> {
        runBlocking {
          encodingJob =
            viewModelScope.launch(Dispatchers.IO) {
              encodeRecording()
              completeAndSaveCurrentMicrotask()
            }
          encodingJob?.join()
          moveToPreviousMicrotask()
          setActivityState(ActivityState.INIT)
        }
      }
      ActivityState.ASSISTANT_PLAYING -> {
        /** This is a dummy state to trigger events before assistant can be played */
      }
      ActivityState.ACTIVITY_STOPPED -> {
        /**
         * This is a dummy state to trigger events (e.g., end recordings). [cleanupOnStop] should
         * take care of handling actual cleanup.
         */
      }
    }
  }

  fun cleanupOnStop() {
    setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)
    setActivityState(ActivityState.ACTIVITY_STOPPED)

    when (previousActivityState) {
      /** If prerecording, join the prerecording job. Reset buffers and release recorder. */
      /** If prerecording, join the prerecording job. Reset buffers and release recorder. */
      ActivityState.PRERECORDING,
      ActivityState.COMPLETED_PRERECORDING -> {
        preRecordingJob?.cancel()
        preRecordBufferConsumed[0] = 0
        preRecordBufferConsumed[1] = 0
        releaseRecorder()
      }

      /**
       * If recording, join preRecordingFlushJob, recordingJob. Reset buffers and release
       * recorder.
       */

      /**
       * If recording, join preRecordingFlushJob, recordingJob. Reset buffers and release
       * recorder.
       */
      ActivityState.RECORDING -> {
        recordingJob?.cancel()
        preRecordBufferConsumed[0] = 0
        preRecordBufferConsumed[1] = 0
        releaseRecorder()
      }

      /** In recorded state, wait for the file flush job to complete */

      /** In recorded state, wait for the file flush job to complete */
      ActivityState.RECORDED -> {
        viewModelScope.launch {
          audioFileFlushJob?.join()
        }
      }

      /** If playing state, pause media player */

      /** If playing state, pause media player */
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED,
      ActivityState.NEW_PLAYING,
      ActivityState.NEW_PAUSED,
      ActivityState.OLD_PLAYING,
      ActivityState.OLD_PAUSED,
      -> {
        releasePlayer()
      }

      /** In simple back and next, wait for prerecording job */

      /** In simple back and next, wait for prerecording job */
      ActivityState.SIMPLE_NEXT,
      ActivityState.SIMPLE_BACK -> {
        preRecordingJob?.cancel()
        releaseRecorder()
      }

      /** Nothing to do states */

      /** Nothing to do states */
      ActivityState.INIT,
      ActivityState.COMPLETED,
      ActivityState.ENCODING_NEXT,
      ActivityState.ENCODING_BACK,
      ActivityState.ASSISTANT_PLAYING,
      ActivityState.ACTIVITY_STOPPED,
      -> {
        // Do nothing
      }
    }
  }

  fun resetOnResume() {
    if (activityState != ActivityState.ACTIVITY_STOPPED)
      return

    when (previousActivityState) {

      /** In initial states, just reset current microtask */
      ActivityState.INIT,
      ActivityState.PRERECORDING,
      ActivityState.COMPLETED_PRERECORDING,
      ActivityState.RECORDING,
      ActivityState.SIMPLE_BACK,
      ActivityState.SIMPLE_NEXT,
      ActivityState.OLD_PAUSED,
      ActivityState.OLD_PLAYING,
      ActivityState.ENCODING_NEXT,
      ActivityState.ENCODING_BACK,
      ActivityState.ASSISTANT_PLAYING, -> {
        resetMicrotask()
      }

      /** If recorded, then move to first playback */
      ActivityState.RECORDED,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED, -> {
        setButtonStates(DISABLED, DISABLED, ACTIVE, DISABLED)
        setActivityState(ActivityState.FIRST_PLAYBACK)
      }

      /** In completed states, move back to completed state */
      ActivityState.COMPLETED,
      ActivityState.NEW_PAUSED,
      ActivityState.NEW_PLAYING, -> {
        setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
        setActivityState(ActivityState.COMPLETED)
      }

      /** Stopped activity is not possible */
      ActivityState.ACTIVITY_STOPPED -> {
        // This is not possible
      }
    }
  }

  /** Play [mediaFilePath] */
  private fun playFile(mediaFilePath: String) {
    val player: MediaPlayer = mediaPlayer!!
    player.setDataSource(mediaFilePath)
    player.prepare()
    _playbackProgressPbMax.value = player.duration
    player.start()
  }

  /** Update the progress bar for the player as long as the activity is in the specific state. */
  private fun updatePlaybackProgress(state: ActivityState) {
    val runnable = Runnable {
      while (state == activityState) {
        val currentPosition = mediaPlayer?.currentPosition
        _playbackProgressPbProgress.value = currentPosition ?: _playbackProgressPbProgress.value
        Thread.sleep(100)
      }
    }
    playbackProgressThread = Thread(runnable)
    playbackProgressThread?.start()
  }

  /** Initialize [audioRecorder] */
  private fun initializeAndStartRecorder() {
    audioRecorder =
      AudioRecord(
        MediaRecorder.AudioSource.MIC,
        samplingRate,
        AUDIO_CHANNEL,
        audioEncoding,
        _recorderBufferSize
      )
    audioRecorder!!.startRecording()
  }

  /** Reset recording length */
  private fun resetRecordingLength(duration: Int? = null) {
    viewModelScope.launch {
      val milliseconds = duration ?: samplesToTime(totalRecordedBytes / 2)
      val centiSeconds = (milliseconds / 10) % 100
      val seconds = milliseconds / 1000
      _recordSecondsTvText.value = seconds.toString()
      _recordCentiSecondsTvText.value = "%02d".format(Locale.ENGLISH, centiSeconds)
    }
  }

  /** Reset wav file on a new recording creation */
  private fun resetWavFile() {
    val wavFileHandle = getAssignmentScratchFile(scratchRecordingFileParams)
    scratchRecordingFile = DataOutputStream(FileOutputStream(wavFileHandle))
    writeWavFileHeader()
  }

  /** Is the current state prerecording? */
  private fun isPrerecordingState(state: ActivityState): Boolean {
    return state == ActivityState.PRERECORDING || state == ActivityState.COMPLETED_PRERECORDING
  }

  /** Start prerecording. In this phase, the data from the audio recorder goes into a buffer. */
  private fun writeAudioDataToPrerecordBuffer() {
    /** Keep reading until prerecording */
    preRecordingJob =
      viewModelScope.launch(Dispatchers.IO) {
        while (isPrerecordingState(activityState)) {
          val currentBuffer = preRecordBuffer[currentPreRecordBufferIndex]
          val consumedBytes = preRecordBufferConsumed[currentPreRecordBufferIndex]
          val remainingBytes = maxPreRecordBytes - consumedBytes

          val readBytes = try {
            audioRecorder!!.read(currentBuffer, consumedBytes, remainingBytes)
          } catch (e: Exception) {
            break
          }

          preRecordBufferConsumed[currentPreRecordBufferIndex] += readBytes

          if (readBytes == remainingBytes) {
            currentPreRecordBufferIndex = 1 - currentPreRecordBufferIndex
            preRecordBufferConsumed[currentPreRecordBufferIndex] = 0
          }
        }
      }
  }

  /**
   * Start recording. Wait for prerecording to complete, if coming from prerecording state. Write
   * recorded data directly to the wav file.
   */
  private fun writeAudioDataToRecordBuffer() {
    recordingJob =
      viewModelScope.launch(Dispatchers.IO) {
        if (isPrerecordingState(previousActivityState)) {
          preRecordingJob!!.join()
        }

        totalRecordedBytes = preRecordBufferConsumed[0] + preRecordBufferConsumed[1]
        totalRecordedBytes =
          if (totalRecordedBytes > maxPreRecordBytes) maxPreRecordBytes else totalRecordedBytes

        var data = ByteArray(_recorderBufferBytes)
        currentRecordBufferConsumed = 0
        var remainingSpace = _recorderBufferBytes

        var readBytes = 0
        while (activityState == ActivityState.RECORDING || readBytes > 0) {
          try {
            readBytes = audioRecorder!!.read(data, currentRecordBufferConsumed, remainingSpace)
          } catch (e: Exception) {
            // Exception likely caused by recording job getting cancelled
            break
          }
          if (readBytes > 0) {
            currentRecordBufferConsumed += readBytes
            remainingSpace -= readBytes
            if (remainingSpace == 0) {
              recordBuffers.add(data)
              data = ByteArray(_recorderBufferBytes)
              currentRecordBufferConsumed = 0
              remainingSpace = _recorderBufferBytes
            }
            totalRecordedBytes += readBytes
            resetRecordingLength()
          }
        }

        recordBuffers.add(data)
      }
  }

  /** Finish recording and finalize the wav file (update the file size) */
  private fun finishRecordingAndFinalizeWavFile() {
    runBlocking {
      audioFileFlushJob =
        CoroutineScope(Dispatchers.IO).launch {
          delay(postRecordingTime.toLong())
          audioRecorder!!.stop()

          recordingJob!!.join()
          audioRecorder!!.release()

          /** Write data to file */
          scratchRecordingFileInitJob.join()

          /** Write the prerecord buffer to file */
          val bufferIndex = currentPreRecordBufferIndex
          val otherIndex = 1 - bufferIndex
          var currentBufferBytes = preRecordBufferConsumed[bufferIndex]
          val otherBufferBytes = preRecordBufferConsumed[otherIndex]

          if (currentBufferBytes < 0) {
            currentBufferBytes = 0
          }

          val currentBuffer = preRecordBuffer[bufferIndex]
          val otherBuffer = preRecordBuffer[otherIndex]

          // If other buffer is not empty, first write tail from other buffer
          if (otherBufferBytes != 0) {
            scratchRecordingFile.write(
              otherBuffer,
              currentBufferBytes,
              maxPreRecordBytes - currentBufferBytes
            )
            totalRecordedBytes = maxPreRecordBytes - currentBufferBytes
          }

          // write current buffer
          scratchRecordingFile.write(currentBuffer, 0, currentBufferBytes)
          totalRecordedBytes += currentBufferBytes

          /** Write the main record buffer */
          for (i in 0 until recordBuffers.lastIndex) {
            scratchRecordingFile.write(recordBuffers[i], 0, _recorderBufferBytes)
            totalRecordedBytes += _recorderBufferBytes
          }

          /** Write the last buffer */
          try {
            if (currentRecordBufferConsumed > 0) {
              val lastBuffer = recordBuffers.last()
              scratchRecordingFile.write(lastBuffer, 0, currentRecordBufferConsumed)
              totalRecordedBytes += currentRecordBufferConsumed
            }
          } catch (e: Exception) {
            // Ignore (rare) errors
          }

          resetRecordingLength()

          /** Close the file */
          scratchRecordingFile.close()

          /** Fix the file size fields in the wav file */
          val dataSize = totalRecordedBytes
          val scratchFile = RandomAccessFile(scratchRecordingFilePath, "rw")
          writeIntAtLocation(scratchFile, dataSize + 36, 4)
          writeIntAtLocation(scratchFile, dataSize, 40)
          scratchFile.close()
        }

      /**
       * If still in recorded state, switch to playback. User may have stopped activity by pressing
       * home button.
       */
      CoroutineScope(Dispatchers.IO).launch {
        audioFileFlushJob!!.join()
        if (activityState == ActivityState.RECORDED) {
          if (noForcedReplay) {
            setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
            setActivityState(ActivityState.COMPLETED)
          } else {
            setButtonStates(DISABLED, DISABLED, ACTIVE, DISABLED)
            setActivityState(ActivityState.FIRST_PLAYBACK)
          }
        }
      }
    }
  }

  /** Write WAV file header */
  private fun writeWavFileHeader() {
    writeString(scratchRecordingFile, "RIFF")
    writeInt(scratchRecordingFile, 0)
    writeString(scratchRecordingFile, "WAVE")
    writeString(scratchRecordingFile, "fmt ")
    writeInt(scratchRecordingFile, 16)
    writeShort(scratchRecordingFile, 1.toShort())
    writeShort(scratchRecordingFile, 1.toShort())
    writeInt(scratchRecordingFile, samplingRate)
    writeInt(scratchRecordingFile, samplingRate * 2)
    writeShort(scratchRecordingFile, 2.toShort())
    writeShort(scratchRecordingFile, 16.toShort())
    writeString(scratchRecordingFile, "data")
    writeInt(scratchRecordingFile, 0)
  }

  /** Encode the scratch wav recording file into a compressed main file. */
  private suspend fun encodeRecording() {
    CoroutineScope(Dispatchers.IO)
      .launch {
        if (compressAudio) {
          RawToAACEncoder().encode(scratchRecordingFilePath, outputRecordingFilePath)
        } else {
          val source = FileInputStream(scratchRecordingFilePath)
          val destination = FileOutputStream(outputRecordingFilePath)
          source.copyTo(destination)
          destination.close()
          source.close()
        }
      }
      .join()
    addOutputFile("recording", outputRecordingFileParams)
  }

  /** Helper method to convert number of [samples] to time in milliseconds */
  private fun samplesToTime(samples: Int): Int {
    return ((samples.toFloat() / samplingRate) * 1000).toInt()
  }

  /** Helper methods to convert [time] in milliseconds to number of samples */
  private fun timeToSamples(time: Int): Int {
    return time * samplingRate / 1000
  }

  /** Helper methods to write data in little endian format */
  private fun writeInt(output: DataOutputStream, value: Int) {
    output.write(value shr 0)
    output.write(value shr 8)
    output.write(value shr 16)
    output.write(value shr 24)
  }

  private fun writeIntAtLocation(output: RandomAccessFile, value: Int, location: Long) {
    val data = ByteArray(4)
    data[0] = (value shr 0).toByte()
    data[1] = (value shr 8).toByte()
    data[2] = (value shr 16).toByte()
    data[3] = (value shr 24).toByte()
    output.seek(location)
    output.write(data)
  }

  private fun writeShort(output: DataOutputStream, value: Short) {
    output.write(value.toInt() shr 0)
    output.write(value.toInt() shr 8)
  }

  private fun writeString(output: DataOutputStream, value: String) {
    for (element in value) {
      output.writeBytes(element.toString())
    }
  }

  /** Initialize [mediaPlayer] */
  private fun initializePlayer() {
    mediaPlayer = MediaPlayer()
  }

  /** Release the media player and hide seek bar */
  private fun releasePlayer() {
    mediaPlayer?.stop()
    mediaPlayer?.reset()
    mediaPlayer?.release()
    mediaPlayer = null
  }

  /** Release the audio recorder */
  fun releaseRecorder() {
    if (audioRecorder?.state == AudioRecord.STATE_INITIALIZED) {
      if (audioRecorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
        audioRecorder?.stop()
      }
    }
    audioRecorder?.release()
    audioRecorder = null
  }
}
