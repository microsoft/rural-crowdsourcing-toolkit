// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.scenarios.speechData

import android.graphics.Color
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.view.View
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.ui.scenarios.common.MicrotaskRenderer
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMain.ButtonState.*
import com.microsoft.research.karya.utils.RawToAACEncoder
import java.io.DataOutputStream
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.lang.Runnable
import kotlinx.android.synthetic.main.speech_data_main.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import java.util.*
import kotlin.collections.ArrayList

/** Audio recording parameters */
private const val SAMPLE_RATE = 44100
private const val AUDIO_CHANNEL = AudioFormat.CHANNEL_IN_MONO
private const val AUDIO_ENCODING = AudioFormat.ENCODING_PCM_16BIT

/**
 * Microtask renderer for the speech-data scenario. Each microtask is a sentence. The activity
 * displays the sentence and prompts the user to record themselves reading out the sentence. The
 * activity presents a next and previous button to navigate around microtasks.
 */
open class SpeechDataMain(
  includeCompleted: Boolean = false,
  finishOnGroupBoundary: Boolean = false,
  prerecordingTime: Int = 250,
  private val postRecordingTime: Int = 250,
) :
  MicrotaskRenderer(
    activityName = "SPEECH_DATA",
    includeCompleted = includeCompleted,
    finishOnGroupBoundary = finishOnGroupBoundary,
  ) {
  /**
   * UI button states
   *
   * [DISABLED]: Greyed out. Cannot click [ENABLED]: Can click [ACTIVE]: Red color. Can click
   */
  private enum class ButtonState {
    DISABLED,
    ENABLED,
    ACTIVE
  }

  /** Activity states */
  private enum class ActivityState {
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
  private lateinit var recordInstruction: String
  private var noForcedReplay: Boolean = false

  /** Audio recorder and media player */
  private var audioRecorder: AudioRecord? = null
  private var mediaPlayer: MediaPlayer? = null

  /** Audio recorder config parameters */
  private val _minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, AUDIO_CHANNEL, AUDIO_ENCODING)
  private val _recorderBufferSize = _minBufferSize * 4
  private val _recorderBufferBytes = _recorderBufferSize

  /** UI State */
  private var activityState: ActivityState = ActivityState.INIT
  private var previousActivityState: ActivityState = ActivityState.INIT
  private var recordBtnState = DISABLED
  private var playBtnState = DISABLED
  private var nextBtnState = DISABLED
  private var backBtnState = DISABLED

  /** Recording config and state */
  private val maxPreRecordBytes = timeToSamples(prerecordingTime) * 2

  private lateinit var preRecordBuffer: Array<ByteArray>
  private var preRecordBufferConsumed: Array<Int> = Array(2) { 0 }
  private var currentPreRecordBufferIndex = 0
  private var totalRecordedBytes = 0
  private var preRecordingJob: Job? = null

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

  /** This activity requires audio recording permissions */
  override fun requiredPermissions(): Array<String> {
    return arrayOf(android.Manifest.permission.RECORD_AUDIO)
  }

  /** Activity setup function. Set view. */
  final override fun setupActivity() {
    /** setup view */
    setContentView(R.layout.speech_data_main)

    /** record instruction */
    recordInstruction = task.params.asJsonObject.get("instruction").asString ?: getString(R.string.record_sentence_desc)
    recordPromptTv.text = recordInstruction

    /** Forced replace */
    noForcedReplay =
      try {
        task.params.asJsonObject.get("noForcedReplay").asBoolean
      } catch (e: Exception) {
        false
      }

    /** Set card corner radius */
    recordBtnCv.addOnLayoutChangeListener {
      _: View,
      left: Int,
      _: Int,
      right: Int,
      _: Int,
      _: Int,
      _: Int,
      _: Int,
      _: Int ->
      recordBtnCv.radius = (right - left).toFloat() / 2
    }

    playBtnCv.addOnLayoutChangeListener { _: View, left: Int, _: Int, right: Int, _: Int, _: Int, _: Int, _: Int, _: Int
      ->
      playBtnCv.radius = (right - left).toFloat() / 2
    }

    /** Set on click listeners */
    recordBtn.setOnClickListener { handleRecordClick() }
    playBtn.setOnClickListener { handlePlayClick() }
    nextBtn.setOnClickListener { handleNextClick() }
    backBtn.setOnClickListener { handleBackClick() }

    setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)

    /** setup [preRecordBuffer] */
    preRecordBuffer = Array(2) { ByteArray(maxPreRecordBytes) }
  }

  /**
   * Clean up on activity stop. Depending on the state, we may have to wait for some jobs to
   * complete.
   */
  final override fun cleanupOnStop() {
    setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)
    setActivityState(ActivityState.ACTIVITY_STOPPED)

    runBlocking {
      when (previousActivityState) {
        /** If prerecording, join the prerecording job. Reset buffers and release recorder. */
        ActivityState.PRERECORDING,
        ActivityState.COMPLETED_PRERECORDING -> {
          preRecordingJob?.join()
          preRecordBufferConsumed[0] = 0
          preRecordBufferConsumed[1] = 0
          releaseRecorder()
        }

        /**
         * If recording, join preRecordingFlushJob, recordingJob. Reset buffers and release
         * recorder.
         */
        ActivityState.RECORDING -> {
          recordingJob?.join()
          preRecordBufferConsumed[0] = 0
          preRecordBufferConsumed[1] = 0
          releaseRecorder()
        }

        /** In recorded state, wait for the file flush job to complete */
        ActivityState.RECORDED -> {
          audioFileFlushJob?.join()
        }

        /** If playing state, pause media player */
        ActivityState.FIRST_PLAYBACK,
        ActivityState.FIRST_PLAYBACK_PAUSED,
        ActivityState.NEW_PLAYING,
        ActivityState.NEW_PAUSED,
        ActivityState.OLD_PLAYING,
        ActivityState.OLD_PAUSED, -> {
          releasePlayer()
        }

        /** In simple back and next, wait for prerecording job */
        ActivityState.SIMPLE_NEXT,
        ActivityState.SIMPLE_BACK -> {
          preRecordingJob?.join()
          releaseRecorder()
        }

        /** Nothing to do states */
        ActivityState.INIT,
        ActivityState.COMPLETED,
        ActivityState.ENCODING_NEXT,
        ActivityState.ENCODING_BACK,
        ActivityState.ASSISTANT_PLAYING,
        ActivityState.ACTIVITY_STOPPED, -> {
          // Do nothing
        }
      }
    }
  }

  /** Reset activity on restart. Determine action depending on the previous state. */
  final override fun resetOnRestart() {
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

  /**
   * Setup a new microtask. Extract the sentence from the microtask input and set [sentenceTv] to
   * that sentence. Create the wav file in the scratch folder and write the WAV header. Depending on
   * whether the current microtask is completed or not, move to PRERECORDING or
   * COMPLETED_PRERECORDING state.
   */
  final override fun setupMicrotask() {
    /** Get the scratch and output file paths */
    scratchRecordingFilePath = getAssignmentScratchFilePath(scratchRecordingFileParams)
    outputRecordingFilePath = getAssignmentOutputFilePath(outputRecordingFileParams)

    /** Write wav file */
    scratchRecordingFileInitJob = ioScope.launch { resetWavFile() }

    sentenceTv.text = currentMicroTask.input.asJsonObject.get("data").toString()
    totalRecordedBytes = 0
    playbackProgressPb.progress = 0

    if (firstTimeActivityVisit) {
      firstTimeActivityVisit = false
      onAssistantClick()
    } else {
      moveToPrerecording()
    }
  }

  /** Move from init to pre-recording */
  private fun moveToPrerecording() {
    preRecordBufferConsumed[0] = 0
    preRecordBufferConsumed[1] = 0

    if (
      currentAssignment.status != MicrotaskAssignmentStatus.COMPLETED) {
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
  private fun setActivityState(targetState: ActivityState) {
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
        playbackProgressPb.progress = 0
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
        playbackProgressPb.progress = playbackProgressPb.max
        setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
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
            playbackProgressPb.progress = playbackProgressPb.max
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
            playbackProgressPb.progress = playbackProgressPb.max
            setButtonStates(ENABLED, ENABLED, ENABLED, ENABLED)
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
            preRecordingJob!!.join()
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
            preRecordingJob!!.join()
          }
          moveToPreviousMicrotask()
          setActivityState(ActivityState.INIT)
        }
      }

      /** ENCODING_NEXT: Encode scratch file to compressed output file. Move to next microtask. */
      ActivityState.ENCODING_NEXT -> {
        runBlocking {
          encodingJob =
            ioScope.launch {
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
            ioScope.launch {
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

  /** On assistant click, take user through the recording process */
  fun onAssistantClick() {

    when (activityState) {
      ActivityState.INIT -> {
        uiScope.launch {
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
      else -> {}
    }
  }

  private fun playRecordPrompt() {
    val oldColor = sentenceTv.currentTextColor
    val filePath = getAudioFilePath(R.string.audio_record_sentence)

    assistant.playAssistantAudio(
      filePath,
      uiCue = {
        sentenceTv.setTextColor(Color.parseColor("#CC6666"))
        sentencePointerIv.visibility = View.VISIBLE
      },
      onCompletionListener = {
        uiScope.launch {
          sentenceTv.setTextColor(oldColor)
          sentencePointerIv.visibility = View.INVISIBLE
          delay(500)
          playRecordAction()
        }
      }
    )
  }

  private fun playRecordAction() {
    val filePath = getAudioFilePath(R.string.audio_record_action)

    uiScope.launch {
      assistant.playAssistantAudio(
        filePath,
        uiCue = {
          recordPointerIv.visibility = View.VISIBLE
          recordBtn.setBackgroundResource(R.drawable.ic_mic_enabled)
        },
        onCompletionListener = {
          uiScope.launch {
            recordPointerIv.visibility = View.INVISIBLE
            delay(500)
            playStopAction()
          }
        }
      )
      delay(1500)
      recordBtn.setBackgroundResource(R.drawable.ic_mic_active)
    }
  }

  private fun playStopAction() {
    val filePath = getAudioFilePath(R.string.audio_stop_action)

    uiScope.launch {
      assistant.playAssistantAudio(
        filePath,
        uiCue = { recordPointerIv.visibility = View.VISIBLE },
        onCompletionListener = {
          uiScope.launch {
            recordPointerIv.visibility = View.INVISIBLE
            delay(500)
            playListenAction()
          }
        }
      )
      delay(500)
      recordBtn.setBackgroundResource(R.drawable.ic_mic_disabled)
    }
  }

  private fun playListenAction() {
    val filePath = getAudioFilePath(R.string.audio_listen_action)

    assistant.playAssistantAudio(
      filePath,
      uiCue = {
        playPointerIv.visibility = View.VISIBLE
        playBtn.setBackgroundResource(R.drawable.ic_speaker_active)
      },
      onCompletionListener = {
        uiScope.launch {
          playBtn.setBackgroundResource(R.drawable.ic_speaker_disabled)
          playPointerIv.visibility = View.INVISIBLE
          delay(500)
          playRerecordAction()
        }
      }
    )
  }

  private fun playRerecordAction() {
    val filePath = getAudioFilePath(R.string.audio_rerecord_action)

    assistant.playAssistantAudio(
      filePath,
      uiCue = {
        recordPointerIv.visibility = View.VISIBLE
        recordBtn.setBackgroundResource(R.drawable.ic_mic_enabled)
      },
      onCompletionListener = {
        uiScope.launch {
          recordBtn.setBackgroundResource(R.drawable.ic_mic_disabled)
          recordPointerIv.visibility = View.INVISIBLE
          delay(500)
          playNextAction()
        }
      }
    )
  }

  private fun playNextAction() {
    val filePath = getAudioFilePath(R.string.audio_next_action)

    assistant.playAssistantAudio(
      filePath,
      uiCue = {
        nextPointerIv.visibility = View.VISIBLE
        nextBtn.setBackgroundResource(R.drawable.ic_next_enabled)
      },
      onCompletionListener = {
        uiScope.launch {
          nextBtn.setBackgroundResource(R.drawable.ic_next_disabled)
          nextPointerIv.visibility = View.INVISIBLE
          delay(500)
          playPreviousAction()
        }
      }
    )
  }

  private fun playPreviousAction() {
    val filePath = getAudioFilePath(R.string.audio_previous_action)

    assistant.playAssistantAudio(
      filePath,
      uiCue = {
        backPointerIv.visibility = View.VISIBLE
        backBtn.setBackgroundResource(R.drawable.ic_back_enabled)
      },
      onCompletionListener = {
        uiScope.launch {
          backBtn.setBackgroundResource(R.drawable.ic_back_disabled)
          backPointerIv.visibility = View.INVISIBLE
          delay(500)
          moveToPrerecording()
        }
      }
    )
  }

  /** Shortcut to set and flush all four button states (in sequence) */
  private fun setButtonStates(b: ButtonState, r: ButtonState, p: ButtonState, n: ButtonState) {
    backBtnState = b
    recordBtnState = r
    playBtnState = p
    nextBtnState = n
    flushButtonStates()
  }

  /** Handle record button click */
  private fun handleRecordClick() {
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

        scratchRecordingFileInitJob = ioScope.launch { resetWavFile() }

        totalRecordedBytes = 0
        setActivityState(ActivityState.RECORDING)
      }

      /** Media player states: Stop and release media player. Reset wav file. Restart recording. */
      ActivityState.OLD_PLAYING,
      ActivityState.OLD_PAUSED,
      ActivityState.NEW_PLAYING,
      ActivityState.NEW_PAUSED, -> {
        setButtonStates(DISABLED, ACTIVE, DISABLED, DISABLED)

        releasePlayer()
        scratchRecordingFileInitJob = ioScope.launch { resetWavFile() }
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
      ActivityState.ACTIVITY_STOPPED, -> {
        // throw Exception("Record button should not be clicked in '$activityState' state")
      }
    }
  }

  /** Handle play button click */
  private fun handlePlayClick() {
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
      ActivityState.ACTIVITY_STOPPED, -> {
        // throw Exception("Play button should not be clicked in '$activityState' state")
      }
    }
  }

  /** Handle next button click */
  private fun handleNextClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    /** Disable all buttons when NEXT is clicked */
    setButtonStates(DISABLED, DISABLED, DISABLED, DISABLED)

    when (activityState) {
      ActivityState.COMPLETED_PRERECORDING, ActivityState.OLD_PLAYING, ActivityState.OLD_PAUSED, -> {
        setActivityState(ActivityState.SIMPLE_NEXT)
      }
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED, -> {
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
      ActivityState.ACTIVITY_STOPPED, -> {
        // throw Exception("Next button should not be clicked in '$activityState' state")
      }
    }
  }

  /** Handle back button click */
  private fun handleBackClick() {
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
      ActivityState.OLD_PAUSED, -> {
        setActivityState(ActivityState.SIMPLE_BACK)
      }
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED, -> {
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
      ActivityState.ACTIVITY_STOPPED, -> {
        // throw Exception("Back button should not be clicked in '$activityState' state")
      }
    }
  }

  override fun onBackPressed() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "ANDROID_BACK")
    log(message)

    when (activityState) {
      ActivityState.INIT,
      ActivityState.PRERECORDING,
      ActivityState.COMPLETED_PRERECORDING,
      ActivityState.RECORDING,
      ActivityState.RECORDED,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED,
      ActivityState.OLD_PLAYING,
      ActivityState.OLD_PAUSED,
      ActivityState.SIMPLE_NEXT,
      ActivityState.SIMPLE_BACK,
      ActivityState.ASSISTANT_PLAYING, -> {
        finish()
      }
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED, -> {
        runBlocking {
          encodeRecording()
          completeAndSaveCurrentMicrotask()
          finish()
        }
      }
      ActivityState.ENCODING_NEXT, ActivityState.ENCODING_BACK, -> {
        runBlocking {
          encodingJob?.join()
          finish()
        }
      }
      ActivityState.ACTIVITY_STOPPED -> {
        // throw Exception("Android back button cannot not be clicked in '$activityState' state")
      }
    }
  }

  /** Initialize [audioRecorder] */
  private fun initializeAndStartRecorder() {
    audioRecorder =
      AudioRecord(MediaRecorder.AudioSource.MIC, SAMPLE_RATE, AUDIO_CHANNEL, AUDIO_ENCODING, _recorderBufferSize)
    audioRecorder!!.startRecording()
  }

  /** Reset recording length */
  private fun resetRecordingLength(duration: Int? = null) {
    uiScope.launch {
      val milliseconds = duration ?: samplesToTime(totalRecordedBytes / 2)
      val centiSeconds = (milliseconds / 10) % 100
      val seconds = milliseconds / 1000
      recordSecondsTv.text = "%d".format(seconds)
      recordCentiSecondsTv.text = "%02d".format(centiSeconds)
    }
  }

  /** Initialize [mediaPlayer] */
  private fun initializePlayer() {
    mediaPlayer = MediaPlayer()
  }

  /** Play [mediaFilePath] */
  private fun playFile(mediaFilePath: String) {
    val player: MediaPlayer = mediaPlayer!!
    player.setDataSource(mediaFilePath)
    player.prepare()
    playbackProgressPb.max = player.duration
    player.start()
  }

  /** Update the progress bar for the player as long as the activity is in the specific state. */
  private fun updatePlaybackProgress(state: ActivityState) {
    val runnable = Runnable {
      while (state == activityState) {
        val currentPosition = mediaPlayer?.currentPosition
        playbackProgressPb.progress = currentPosition ?: playbackProgressPb.progress
        Thread.sleep(100)
      }
    }
    playbackProgressThread = Thread(runnable)
    playbackProgressThread?.start()
  }

  /** Is the current state prerecording? */
  private fun isPrerecordingState(state: ActivityState): Boolean {
    return state == ActivityState.PRERECORDING || state == ActivityState.COMPLETED_PRERECORDING
  }

  /** Start prerecording. In this phase, the data from the audio recorder goes into a buffer. */
  private fun writeAudioDataToPrerecordBuffer() {
    /** Keep reading until prerecording */
    preRecordingJob =
      ioScope.launch {
        while (isPrerecordingState(activityState)) {
          val currentBuffer = preRecordBuffer[currentPreRecordBufferIndex]
          val consumedBytes = preRecordBufferConsumed[currentPreRecordBufferIndex]
          val remainingBytes = maxPreRecordBytes - consumedBytes

          val readBytes = audioRecorder!!.read(currentBuffer, consumedBytes, remainingBytes)
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
      ioScope.launch {
        if (isPrerecordingState(previousActivityState)) {
          preRecordingJob!!.join()
        }

        totalRecordedBytes = preRecordBufferConsumed[0] + preRecordBufferConsumed[1]
        totalRecordedBytes = if (totalRecordedBytes > maxPreRecordBytes) maxPreRecordBytes else totalRecordedBytes

        var data = ByteArray(_recorderBufferBytes)
        currentRecordBufferConsumed = 0
        var remainingSpace = _recorderBufferBytes

        var readBytes = 0
        while (activityState == ActivityState.RECORDING || readBytes > 0) {
          readBytes = audioRecorder!!.read(data, currentRecordBufferConsumed, remainingSpace)
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
        ioScope.launch {
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
            scratchRecordingFile.write(otherBuffer, currentBufferBytes, maxPreRecordBytes - currentBufferBytes)
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
      uiScope.launch {
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

  /** Release the audio recorder */
  private fun releaseRecorder() {
    if (audioRecorder?.state == AudioRecord.STATE_INITIALIZED) {
      if (audioRecorder?.recordingState == AudioRecord.RECORDSTATE_RECORDING) {
        audioRecorder?.stop()
      }
    }
    audioRecorder?.release()
    audioRecorder = null
  }

  /** Release the media player and hide seek bar */
  private fun releasePlayer() {
    mediaPlayer?.stop()
    mediaPlayer?.reset()
    mediaPlayer?.release()
    mediaPlayer = null
  }

  /** Flush button states */
  private fun flushButtonStates() {
    // Set the clickable states first
    recordBtn.isClickable = recordBtnState != DISABLED
    playBtn.isClickable = playBtnState != DISABLED
    backBtn.isClickable = backBtnState != DISABLED
    nextBtn.isClickable = nextBtnState != DISABLED

    // Set the background
    recordBtn.setBackgroundResource(
      when (recordBtnState) {
        DISABLED -> R.drawable.ic_mic_disabled
        ENABLED -> R.drawable.ic_mic_enabled
        ACTIVE -> R.drawable.ic_mic_active
      }
    )

    playBtn.setBackgroundResource(
      when (playBtnState) {
        DISABLED -> R.drawable.ic_speaker_disabled
        ENABLED -> R.drawable.ic_speaker_enabled
        ACTIVE -> R.drawable.ic_speaker_active
      }
    )

    nextBtn.setBackgroundResource(
      when (nextBtnState) {
        DISABLED -> R.drawable.ic_next_disabled
        ENABLED -> R.drawable.ic_next_enabled
        ACTIVE -> R.drawable.ic_next_enabled
      }
    )

    backBtn.setBackgroundResource(
      when (backBtnState) {
        DISABLED -> R.drawable.ic_back_disabled
        ENABLED -> R.drawable.ic_back_enabled
        ACTIVE -> R.drawable.ic_back_enabled
      }
    )
  }

  /** Reset wav file on a new recording creation */
  private fun resetWavFile() {
    val wavFileHandle = getAssignmentScratchFile(scratchRecordingFileParams)
    scratchRecordingFile = DataOutputStream(FileOutputStream(wavFileHandle))
    writeWavFileHeader()
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
    writeInt(scratchRecordingFile, SAMPLE_RATE)
    writeInt(scratchRecordingFile, SAMPLE_RATE * 2)
    writeShort(scratchRecordingFile, 2.toShort())
    writeShort(scratchRecordingFile, 16.toShort())
    writeString(scratchRecordingFile, "data")
    writeInt(scratchRecordingFile, 0)
  }

  /** Encode the scratch wav recording file into a compressed main file. */
  private suspend fun encodeRecording() {
    CoroutineScope(Dispatchers.Default)
      .launch { RawToAACEncoder().encode(scratchRecordingFilePath, outputRecordingFilePath) }
      .join()
    addOutputFile(outputRecordingFileParams)
  }

  /** Helper methods to convert [time] in milliseconds to number of samples */
  private fun timeToSamples(time: Int): Int {
    return time * SAMPLE_RATE / 1000
  }

  /** Helper method to convert number of [samples] to time in milliseconds */
  private fun samplesToTime(samples: Int): Int {
    return ((samples.toFloat() / SAMPLE_RATE) * 1000).toInt()
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
}
