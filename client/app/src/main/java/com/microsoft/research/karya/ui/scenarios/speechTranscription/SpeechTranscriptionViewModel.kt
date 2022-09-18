package com.microsoft.research.karya.ui.scenarios.speechTranscription

import android.media.MediaPlayer
import androidx.annotation.StringRes
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class SpeechTranscriptionViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
  dataStore: DataStore<Preferences>
) : BaseMTRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager,
  dataStore
) {

  /** UI button states */
  enum class ButtonState {
    DISABLED,
    ENABLED,
    ACTIVE
  }

  /** Activity states */
  private enum class ActivityState {
    INIT,
    WAIT_FOR_PLAY,
    FIRST_PLAYBACK,
    FIRST_PLAYBACK_PAUSED,
    REVIEW_ENABLED,
    PLAYBACK,
    PLAYBACK_PAUSED,
    ACTIVITY_STOPPED
  }

  /** UI State */
  private var activityState: ActivityState = ActivityState.INIT
  private var previousActivityState: ActivityState = ActivityState.INIT
  private var playBtnState: ButtonState = ButtonState.DISABLED
  private var nextBtnState: ButtonState = ButtonState.DISABLED
  private var backBtnState: ButtonState = ButtonState.DISABLED

  // Media player
  private val mediaPlayer = MediaPlayer()

  // Recording file path
  private val _recordingFilePath = MutableStateFlow("")
  val recordingFilePath = _recordingFilePath.asStateFlow()

  // Defining Mutable State Flows
  private val _transcriptionText: MutableStateFlow<String> = MutableStateFlow("")
  val transcriptionText = _transcriptionText.asStateFlow()

  private val _assistWords: MutableStateFlow<List<String>> = MutableStateFlow(listOf())
  val assistWords = _assistWords.asStateFlow()

  private val _playbackSecondsTvText: MutableStateFlow<String> = MutableStateFlow("")
  val playbackSecondsTvText = _playbackSecondsTvText.asStateFlow()

  private val _playbackCentiSecondsTvText: MutableStateFlow<String> = MutableStateFlow("")
  val playbackCentiSecondsTvText = _playbackCentiSecondsTvText.asStateFlow()

  private val _playbackProgressPbMax: MutableStateFlow<Int> = MutableStateFlow(0)
  val playbackProgressPbMax = _playbackProgressPbMax.asStateFlow()

  private val _playbackProgress: MutableStateFlow<Int> = MutableStateFlow(0)
  val playbackProgress = _playbackProgress.asStateFlow()

  private val _navAndMediaBtnGroup: MutableStateFlow<Triple<ButtonState, ButtonState, ButtonState>> =
    MutableStateFlow(Triple(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED))

  // Button State Order: PlayButton, NextButton, BackButton
  val navAndMediaBtnGroup = _navAndMediaBtnGroup.asStateFlow()

  private val _showErrorWithDialog: MutableStateFlow<String> = MutableStateFlow("")
  val showErrorWithDialog = _showErrorWithDialog.asStateFlow()

  // Trigger Spotlight
  private val _playRecordPromptTrigger: MutableStateFlow<Boolean> = MutableStateFlow(false)
  val playRecordPromptTrigger = _playRecordPromptTrigger.asStateFlow()

  override fun setupMicrotask() {
    val recordingFileName =
      currentMicroTask.input.asJsonObject.getAsJsonObject("files").get("recording").asString
    val recordingFile =
      microtaskInputContainer.getMicrotaskInputFilePath(currentMicroTask.id, recordingFileName)

    try {
      // Check with media player to see if it is valid file
      mediaPlayer.setDataSource(recordingFile)
      mediaPlayer.prepare()

      // Set andexo player recording file if valid file
      _recordingFilePath.value = recordingFile
    } catch (e: Exception) {
      showErrorWithDialogBox("Corrupt audio file")
      handleCorruptAudio()
      return
    }

    val inputData = currentMicroTask.input.asJsonObject.getAsJsonObject("data")

    // Bag of word assistance
    val bagOfWordsAssist = try {
      if (inputData.has("bow-assist")) {
        inputData.get("bow-assist").asBoolean
      } else {
        true
      }
    } catch (e:Exception) {
      true
    }

    // Initial transcript
    val transcript = try {
      if (inputData.has("sentence")) {
        inputData.get("sentence").asString
      } else {
        ""
      }
    } catch (e: Exception) {
      ""
    }

    if (bagOfWordsAssist) {
      _assistWords.value = transcript.split(" ")
    } else {
      _transcriptionText.value = transcript
    }

    // If task is completed, then update transcript with users output
    if (currentAssignment.status == MicrotaskAssignmentStatus.COMPLETED) {
      val outputTranscript = try {
        currentAssignment.output.asJsonObject.get("data").asJsonObject.get("transcription").asString
      } catch (e: Exception) {
        ""
      }
      _transcriptionText.value = outputTranscript
    }

    setActivityState(ActivityState.REVIEW_ENABLED)
  }

  override fun onFirstTimeVisit() {
    super.onFirstTimeVisit()
    onAssistantClick()
  }

  private fun playRecordPrompt() {
    _playRecordPromptTrigger.value = true
  }

  private fun onAssistantClick() {
    playRecordPrompt()
  }

  private fun showErrorWithDialogBox(msg: String) {
    _showErrorWithDialog.value = msg
  }

  /** Set activity state */
  private fun setActivityState(targetState: ActivityState) {
    /** Log the state transition */
    val message = JsonObject()
    message.addProperty("type", "->")
    message.addProperty("from", activityState.toString())
    message.addProperty("to", targetState.toString())
    log(message)

    /** Switch state */
    previousActivityState = activityState
    activityState = targetState

    when (activityState) {
      /** INIT: may not be necessary */
      ActivityState.INIT -> {
      }

      /** Wait for the play button to be clicked */
      ActivityState.WAIT_FOR_PLAY -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.DISABLED)
      }

      /** Start the first play back */
      ActivityState.FIRST_PLAYBACK -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ACTIVE, ButtonState.DISABLED)
        updatePlaybackProgress(ActivityState.FIRST_PLAYBACK)
      }

      /** Pause first play back */
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.DISABLED)
      }

      /** Enable the review stage */
      ActivityState.REVIEW_ENABLED -> {
        // playbackProgressThread.join()
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.ENABLED)
      }

      /** Subsequent play back */
      ActivityState.PLAYBACK -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ACTIVE, ButtonState.ENABLED)
        updatePlaybackProgress(ActivityState.PLAYBACK)
      }

      /** Pause subsequent play back */
      ActivityState.PLAYBACK_PAUSED -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.ENABLED)
      }

      /** Activity stopped */
      ActivityState.ACTIVITY_STOPPED -> {
      }
    }
  }

  /** Handle play button click */
  internal fun handlePlayClick() {
    /** Log the click */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "PLAY")
    message.addProperty("state", playBtnState.toString())
    log(message)

    when (activityState) {
      ActivityState.WAIT_FOR_PLAY -> {
        setActivityState(ActivityState.FIRST_PLAYBACK)
      }
      ActivityState.FIRST_PLAYBACK -> {
        setActivityState(ActivityState.FIRST_PLAYBACK_PAUSED)
      }
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        setActivityState(ActivityState.FIRST_PLAYBACK)
      }
      ActivityState.REVIEW_ENABLED -> {
        setActivityState(ActivityState.PLAYBACK)
      }
      ActivityState.PLAYBACK -> {
        setActivityState(ActivityState.PLAYBACK_PAUSED)
      }
      ActivityState.PLAYBACK_PAUSED -> {
        setActivityState(ActivityState.PLAYBACK)
      }
      ActivityState.INIT, ActivityState.ACTIVITY_STOPPED -> {
      }
    }
  }

  /**
   * Set transcription text
   */
  internal fun setTranscriptionText(text: String) {
    _transcriptionText.value = text;
  }

  /** Handle next button click */
  internal fun handleNextClick() {
    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    /** Disable all buttons */
    setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)

    outputData.addProperty("transcription", _transcriptionText.value)

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      setActivityState(ActivityState.INIT)
      moveToNextMicrotask()
      // Reset Flow layout
      _assistWords.value = arrayListOf()
    }
  }

  /** Handle back button click */
  internal fun handleBackClick() {
    moveToPreviousMicrotask()
  }

  /** Set button states */
  private fun setButtonStates(
    backState: ButtonState,
    playState: ButtonState,
    nextState: ButtonState,
  ) {
    _navAndMediaBtnGroup.value = Triple(backState, playState, nextState)
  }

  /** Update the progress bar for the player as long as the activity is in the specific state. */
  private fun updatePlaybackProgress(state: ActivityState) {
  }

  /** Reset recording length */
  private fun resetRecordingLength(duration: Int) {
    viewModelScope.launch {
      val centiSeconds = (duration / 10) % 100
      val seconds = duration / 1000
      _playbackSecondsTvText.value = seconds.toString()
      _playbackCentiSecondsTvText.value = "%02d".format(Locale.ENGLISH, centiSeconds)
    }
  }

  // Handle the corrupt Audio Case
  fun handleCorruptAudio(msg: String? = "") {
    outputData.addProperty("flag", "corrupt")
    outputData.addProperty("message", msg)

    // Move to next task
    handleNextClick()
  }

}

