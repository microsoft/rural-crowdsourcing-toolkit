package com.microsoft.research.karya.ui.scenarios.signVideo

import android.media.AudioFormat
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import com.microsoft.research.karya.ui.scenarios.signVideo.SignVideoMainViewModel.ButtonState.DISABLED
import com.microsoft.research.karya.ui.scenarios.signVideo.SignVideoMainViewModel.ButtonState.ENABLED
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.android.synthetic.main.fragment_sign_video_init.*
import kotlinx.android.synthetic.main.speech_data_main.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import javax.inject.Inject

/** Audio recording parameters */
private const val SAMPLE_RATE = 44100
private const val AUDIO_CHANNEL = AudioFormat.CHANNEL_IN_MONO
private const val AUDIO_ENCODING = AudioFormat.ENCODING_PCM_16BIT

@HiltViewModel
class SignVideoMainViewModel
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

  /** Final recording file */
  private val outputRecordingFileParams = Pair("", "mp4")
  lateinit var outputRecordingFilePath: String

  /** Activity State */
  private var activityState: ActivityState = ActivityState.INIT
  private var previousActivityState: ActivityState = ActivityState.INIT

  /** UI State **/
  private val _recordBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val recordBtnState = _recordBtnState.asStateFlow()

  private val _backBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val backBtnState = _backBtnState.asStateFlow()

  private val _nextBtnState: MutableStateFlow<ButtonState> = MutableStateFlow(DISABLED)
  val nextBtnState = _nextBtnState.asStateFlow()

  private val _sentenceTvText: MutableStateFlow<String> = MutableStateFlow("")
  val sentenceTvText = _sentenceTvText.asStateFlow()

  private val _videoPlayerVisibility: MutableStateFlow<Boolean> = MutableStateFlow(false)
  val videoPlayerVisibility = _videoPlayerVisibility.asStateFlow()

  private val _launchRecordVideo: MutableSharedFlow<Boolean> = MutableSharedFlow(0)
  val launchRecordVideo = _launchRecordVideo.asSharedFlow()

  private val _videoSource: MutableStateFlow<String> = MutableStateFlow("")
  val videoSource = _videoSource.asStateFlow()

  init {
    setActivityState(ActivityState.INIT)
  }

  /**
   * UI button states
   *
   * [DISABLED]: Greyed out. Cannot click [ENABLED]: Can click
   */
  enum class ButtonState {
    DISABLED,
    ENABLED
  }

  /** Activity states */
  private enum class ActivityState {
    INIT,
    COMPLETED_SETUP,
    COOLDOWN_COMPLETE,
    FIRST_PLAYBACK,
    FIRST_PLAYBACK_PAUSED,
    COMPLETED,
    NEW_PLAYING,
    NEW_PAUSED,
  }

  /** Shortcut to set and flush all four button states (in sequence) */
  private fun setButtonStates(b: ButtonState, r: ButtonState, n: ButtonState) {
    _backBtnState.value = b
    _recordBtnState.value = r
    _nextBtnState.value = n
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
        hideVideoPlayer()
        setButtonStates(DISABLED, DISABLED, DISABLED)
      }

      ActivityState.COMPLETED_SETUP -> {
        hideVideoPlayer()
        setButtonStates(ENABLED, DISABLED, DISABLED)
      }

      /** COMPLETED: release the media player */
      ActivityState.COMPLETED -> {
        showVideoPlayer()
        addOutputFile("recording", outputRecordingFileParams)
        viewModelScope.launch {
          completeAndSaveCurrentMicrotask()
          setButtonStates(ENABLED, ENABLED, ENABLED)
        }
      }

      ActivityState.COOLDOWN_COMPLETE -> {
        setButtonStates(ENABLED, ENABLED, DISABLED)
      }

      /**
       * NEW_PLAYING
       */
      ActivityState.NEW_PLAYING -> {
        showVideoPlayer()
        setButtonStates(ENABLED, ENABLED, ENABLED)
      }

      /** NEW_PAUSED */
      ActivityState.NEW_PAUSED -> {
        showVideoPlayer()
        setButtonStates(ENABLED, ENABLED, ENABLED)
      }

      /** FIRST PLAYBACK */
      ActivityState.FIRST_PLAYBACK -> {
        showVideoPlayer()
        setButtonStates(DISABLED, DISABLED, DISABLED)
      }

      /** FIRST PLAYBACK PAUSED */
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        showVideoPlayer()
        setButtonStates(DISABLED, DISABLED, DISABLED)
      }
    }
  }

  private fun showVideoPlayer() {
    _videoPlayerVisibility.value = true
  }

  private fun hideVideoPlayer() {
    _videoPlayerVisibility.value = false
  }


  /** Handle record button click */
  fun handleRecordClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "RECORD")
    message.addProperty("state", recordBtnState.toString())
    log(message)

    viewModelScope.launch { _launchRecordVideo.emit(true) }

  }

  /** Handle next button click */
  fun handleNextClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    moveToNextMicrotask()
    setActivityState(ActivityState.INIT)
  }

  /** Handle back button click */
  fun handleBackClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "BACK")
    log(message)

    moveToPreviousMicrotask()
    setActivityState(ActivityState.INIT)
  }

  fun onBackPressed() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "ANDROID_BACK")
    log(message)

    when (activityState) {
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED -> {
        runBlocking {
          completeAndSaveCurrentMicrotask()
          navigateBack()
        }
      }
    }
    navigateBack()
  }


  override fun setupMicrotask() {
    /** Get the scratch and output file paths */
    outputRecordingFilePath =
      assignmentOutputContainer.getAssignmentOutputFilePath(
        microtaskAssignmentIDs[currentAssignmentIndex],
        outputRecordingFileParams
      )

    val sentence =
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").toString()
    _sentenceTvText.value = sentence

    if (currentAssignment.status == MicrotaskAssignmentStatus.COMPLETED) {
      setVideoSource(outputRecordingFilePath)
      setActivityState(ActivityState.COMPLETED)
    } else {
      if (activityState == ActivityState.INIT) {
        setActivityState(ActivityState.COMPLETED_SETUP)
        startCooldownTimer()
      }
    }
  }

  fun setVideoSource(source: String) {
    _videoSource.value = source
  }

  private fun startCooldownTimer() {

    viewModelScope.launch {
      delay(BUTTON_COOLDOWN_TIME)
      setActivityState(ActivityState.COOLDOWN_COMPLETE)
    }

  }

  fun onPlayerEnded() {
    setActivityState(ActivityState.COMPLETED)
  }

  fun onVideoReceived() {
    if (activityState == ActivityState.COOLDOWN_COMPLETE) {
      setActivityState(ActivityState.FIRST_PLAYBACK)
    }
  }


}
