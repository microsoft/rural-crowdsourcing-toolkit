// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.scenarios.signVideo

import android.app.Activity
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.lifecycle.lifecycleScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.MicrotaskRenderer
import kotlinx.android.synthetic.main.fragment_sign_video_init.*
import kotlinx.android.synthetic.main.fragment_sign_video_init.backBtn
import kotlinx.android.synthetic.main.fragment_sign_video_init.nextBtn
import kotlinx.android.synthetic.main.fragment_sign_video_init.recordBtn
import kotlinx.android.synthetic.main.fragment_sign_video_init.sentenceTv
import kotlinx.android.synthetic.main.speech_data_main.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking


const val BUTTON_COOLDOWN_TIME: Long = 3000

/**
 * Microtask renderer for the speech-data scenario. Each microtask is a sentence. The activity
 * displays the sentence and prompts the user to record themselves reading out the sentence. The
 * activity presents a next and previous button to navigate around microtasks.
 */
open class SignVideoMain(
  includeCompleted: Boolean = false,
  finishOnGroupBoundary: Boolean = false,
) :
  MicrotaskRenderer(
    activityName = "SPEECH_DATA",
    includeCompleted = includeCompleted,
    finishOnGroupBoundary = finishOnGroupBoundary,
  ) {

  val recordVideoLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->

      if (result.resultCode == RESULT_OK) {
        videoPlayer.setVideoPath(outputRecordingFilePath)
        videoPlayer.start()
      }
    }

  /**
   * UI button states
   *
   * [DISABLED]: Greyed out. Cannot click [ENABLED]: Can click [ACTIVE]: Red color. Can click
   */
  private enum class ButtonState {
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

  /** UI strings */
  private lateinit var recordInstruction: String
  private var noForcedReplay: Boolean = false

  /** UI State */
  private var activityState: ActivityState = ActivityState.INIT
  private var previousActivityState: ActivityState = ActivityState.INIT
  private var recordBtnState = ButtonState.DISABLED
  private var nextBtnState = ButtonState.DISABLED
  private var backBtnState = ButtonState.DISABLED

  /** Final recording file */
  private val outputRecordingFileParams = Pair("", "mp4")
  private lateinit var outputRecordingFilePath: String

  /** This activity requires audio recording permissions */
  override fun requiredPermissions(): Array<String> {
    return arrayOf(android.Manifest.permission.RECORD_AUDIO, android.Manifest.permission.CAMERA)
  }

  /** Shortcut to set and flush all four button states (in sequence) */
  private fun setButtonStates(b: ButtonState, r: ButtonState, n: ButtonState) {
    backBtnState = b
    recordBtnState = r
    nextBtnState = n
    flushButtonStates()
  }

  /** Flush button states */
  private fun flushButtonStates() {
    // Set the clickable states first
    recordBtn.isClickable = recordBtnState != ButtonState.DISABLED
    backBtn.isClickable = backBtnState != ButtonState.DISABLED
    nextBtn.isClickable = nextBtnState != ButtonState.DISABLED

    recordBtn.alpha =
      when (recordBtnState) {
        ButtonState.DISABLED -> 0.5F
        ButtonState.ENABLED -> 1F
      }

    nextBtn.setBackgroundResource(
      when (nextBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_next_disabled
        ButtonState.ENABLED -> R.drawable.ic_next_enabled
      }
    )

    backBtn.setBackgroundResource(
      when (backBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_back_disabled
        ButtonState.ENABLED -> R.drawable.ic_back_enabled
      }
    )

  }

  /** Activity setup function. Set view. */
  final override fun setupActivity() {
    /** setup view */
    setContentView(R.layout.fragment_sign_video_init)

    setActivityState(ActivityState.INIT)

    /** record instruction */
    recordInstruction = task.params.asJsonObject.get("instruction").asString ?: getString(R.string.record_video_desc)
    videoRecordPromptTv.text = recordInstruction

    /** Forced replace */
    noForcedReplay =
      try {
        task.params.asJsonObject.get("noForcedReplay").asBoolean
      } catch (e: Exception) {
        false
      }

    /** Set on click listeners */
    recordBtn.setOnClickListener { handleRecordClick() }
    nextBtn.setOnClickListener { handleNextClick() }
    backBtn.setOnClickListener { handleBackClick() }
  }

  /**
   * Clean up on activity stop. Depending on the state, we may have to wait for some jobs to
   * complete.
   */
  final override fun cleanupOnStop() {

  }

  /** Reset activity on restart. Determine action depending on the previous state. */
  final override fun resetOnRestart() {
  }

  /**
   * Setup a new microtask. Extract the sentence from the microtask input and set [sentenceTv] to
   * that sentence. Create the wav file in the scratch folder and write the WAV header. Depending on
   * whether the current microtask is completed or not, move to PRERECORDING or
   * COMPLETED_PRERECORDING state.
   */
  final override fun setupMicrotask() {
    /** Get the scratch and output file paths */
    outputRecordingFilePath = getAssignmentOutputFilePath(outputRecordingFileParams)


    sentenceTv.text = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").toString()

    if (activityState == ActivityState.INIT){
      setActivityState(ActivityState.COMPLETED_SETUP)
    }
    startCooldownTimer()
  }

  private fun startCooldownTimer() {

    lifecycleScope.launch {
      delay(BUTTON_COOLDOWN_TIME)
      setActivityState(ActivityState.COOLDOWN_COMPLETE)
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
        setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)
      }

      ActivityState.COMPLETED_SETUP -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.DISABLED, ButtonState.DISABLED)
      }

      /** COMPLETED: release the media player */
      ActivityState.COMPLETED -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.DISABLED)
      }

      ActivityState.COOLDOWN_COMPLETE -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.DISABLED)
      }

      /**
       * NEW_PLAYING
       */
      ActivityState.NEW_PLAYING -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.ENABLED)
      }

      /** NEW_PAUSED */
      ActivityState.NEW_PAUSED -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.ENABLED)
      }

      /** FIRST PLAYBACK */
      ActivityState.FIRST_PLAYBACK -> {
        setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)
      }

      /** FIRST PLAYBACK PAUSED */
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)
      }
    }
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
    val intent = Intent(this, SignVideoRecord::class.java)
    intent.putExtra("video_file_path", outputRecordingFilePath)
    recordVideoLauncher.launch(intent)

  }

  /** Handle next button click */
  private fun handleNextClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    moveToNextMicrotask()
    setActivityState(ActivityState.INIT)
  }

  /** Handle back button click */
  private fun handleBackClick() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "BACK")
    log(message)

    moveToPreviousMicrotask()
    setActivityState(ActivityState.INIT)
  }

  override fun onBackPressed() {
    // log the state transition
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "ANDROID_BACK")
    log(message)

    when (activityState) {
      ActivityState.COMPLETED, ActivityState.NEW_PLAYING, ActivityState.NEW_PAUSED -> {
        runBlocking {
          completeAndSaveCurrentMicrotask()
          setResult(Activity.RESULT_OK, intent)
          finish()
        }
      }
    }
  }

}
