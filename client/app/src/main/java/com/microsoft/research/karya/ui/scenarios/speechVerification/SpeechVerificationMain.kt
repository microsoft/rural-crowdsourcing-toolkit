// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.scenarios.speechVerification

import android.app.AlertDialog
import android.graphics.Color
import android.media.MediaPlayer
import android.view.View
import androidx.annotation.StringRes
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.MicrotaskRenderer
import kotlinx.android.synthetic.main.microtask_speech_verification.*
import kotlinx.coroutines.launch

class SpeechVerificationMain :
  MicrotaskRenderer(
    activityName = "SPEECH_VERIFICATION",
    includeCompleted = false,
    finishOnGroupBoundary = false,
  ) {
  /** UI button states */
  private enum class ButtonState {
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

  /** Media player */
  private var mediaPlayer: MediaPlayer? = null

  /** UI State */
  private var activityState: ActivityState = ActivityState.INIT
  private var previousActivityState: ActivityState = ActivityState.INIT
  private var playBtnState: ButtonState = ButtonState.DISABLED
  private var nextBtnState: ButtonState = ButtonState.DISABLED
  private var backBtnState: ButtonState = ButtonState.DISABLED

  /** Verification status */
  @StringRes private var accuracyRating = R.string.rating_undefined

  @StringRes private var qualityRating = R.string.rating_undefined

  @StringRes private var volumeRating = R.string.rating_undefined
  private var reviewCompleted = false

  private lateinit var playbackProgressThread: Thread

  /**
   * Setup the view for the microtask renderer. Called at the end of the [onCreate]. This function
   * can also be used to extract specific objects in the views.
   */
  override fun setupActivity() {
    /** Setup view */
    setContentView(R.layout.microtask_speech_verification)

    /** Set corner radius for button */
    playBtnCv.addOnLayoutChangeListener { _: View, left: Int, _: Int, right: Int, _: Int, _: Int, _: Int, _: Int, _: Int
      ->
      playBtnCv.radius = (right - left).toFloat() / 2
    }

    /** Set on click listeners for buttons */
    playBtn.setOnClickListener { handlePlayClick() }
    nextBtn.setOnClickListener { handleNextClick() }
    backBtn.setOnClickListener { handleBackClick() }

    /** Set button states */
    setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)

    /** Disable review elements */
    disableReview()

    /** Set on click listeners for review buttons */
    accuracyCorrectBtn.setOnClickListener { handleAccuracyChange(R.string.accuracy_correct) }
    accuracyIncorrectBtn.setOnClickListener { handleAccuracyChange(R.string.accuracy_incorrect) }
    accuracyErrorsBtn.setOnClickListener { handleAccuracyChange(R.string.accuracy_errors) }
    qualityGoodBtn.setOnClickListener { handleQualityChange(R.string.quality_good) }
    qualityBadBtn.setOnClickListener { handleQualityChange(R.string.quality_bad) }
    qualityNoisyBtn.setOnClickListener { handleQualityChange(R.string.quality_noisy) }
    volumeHighBtn.setOnClickListener { handleVolumeChange(R.string.volume_high) }
    volumeLowBtn.setOnClickListener { handleVolumeChange(R.string.volume_low) }
    volumeOkayBtn.setOnClickListener { handleVolumeChange(R.string.volume_okay) }
  }

  /** Cleanup function called during [onStop]. */
  override fun cleanupOnStop() {
    setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)
    setActivityState(ActivityState.ACTIVITY_STOPPED)
    mediaPlayer?.stop()
    mediaPlayer?.release()
    mediaPlayer = null
  }

  /** Reset activity on restart. Called during [onRestart] */
  override fun resetOnRestart() {
    when (previousActivityState) {
      ActivityState.INIT,
      ActivityState.WAIT_FOR_PLAY,
      ActivityState.FIRST_PLAYBACK,
      ActivityState.FIRST_PLAYBACK_PAUSED, -> {
        resetMicrotask()
      }
      ActivityState.REVIEW_ENABLED, ActivityState.PLAYBACK_PAUSED, ActivityState.PLAYBACK, -> {
        setActivityState(ActivityState.REVIEW_ENABLED)
      }
      ActivityState.ACTIVITY_STOPPED -> {}
    }
  }

  /**
   * Setup microtask after updating [currentAssignmentIndex]. Called at the end of [onResume], and
   * navigating to next or previous tasks
   */
  override fun setupMicrotask() {
    handleAccuracyChange(R.string.rating_undefined)
    handleQualityChange(R.string.rating_undefined)
    handleVolumeChange(R.string.rating_undefined)

    disableReview()
    reviewCompleted = false

    val sentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").toString()
    val recordingFileName = currentMicroTask.input.asJsonObject.getAsJsonObject("files").get("recording").asString
    val recordingFile = getMicrotaskInputFilePath(recordingFileName)

    sentenceTv.text = sentence

    /** setup media player */
    mediaPlayer = MediaPlayer()
    mediaPlayer!!.setOnCompletionListener { setActivityState(ActivityState.REVIEW_ENABLED) }
    mediaPlayer!!.setDataSource(recordingFile)

    try {
      mediaPlayer!!.prepare()
      resetRecordingLength(mediaPlayer!!.duration)
      playbackProgressPb.max = mediaPlayer!!.duration
      playbackProgressPb.progress = 0

      setActivityState(ActivityState.WAIT_FOR_PLAY)
    } catch (exception: Exception) {
      // Alert dialog
      val alertDialogBuilder = AlertDialog.Builder(this@SpeechVerificationMain)
      alertDialogBuilder.setMessage("Audio file is corrupt")
      alertDialogBuilder.setNeutralButton("Ok") { _, _ ->
        // Give 2 on all reports
        accuracyRating = R.string.accuracy_incorrect
        volumeRating = R.string.volume_low
        qualityRating = R.string.quality_bad

        outputData.addProperty("flag", "corrupt")

        // Move to next task
        handleNextClick()
      }
      val alertDialog = alertDialogBuilder.create()
      alertDialog.setCancelable(false)
      alertDialog.setCanceledOnTouchOutside(false)
      alertDialog.show()
    }
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
      ActivityState.INIT -> {}

      /** Wait for the play button to be clicked */
      ActivityState.WAIT_FOR_PLAY -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.DISABLED)
      }

      /** Start the first play back */
      ActivityState.FIRST_PLAYBACK -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ACTIVE, ButtonState.DISABLED)
        mediaPlayer!!.start()
        updatePlaybackProgress(ActivityState.FIRST_PLAYBACK)
      }

      /** Pause first play back */
      ActivityState.FIRST_PLAYBACK_PAUSED -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.DISABLED)
        mediaPlayer!!.pause()
      }

      /** Enable the review stage */
      ActivityState.REVIEW_ENABLED -> {
        playbackProgressThread.join()
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, nextBtnState)
        enableReviewing()
      }

      /** Subsequent play back */
      ActivityState.PLAYBACK -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ACTIVE, nextBtnState)
        mediaPlayer!!.start()
        updatePlaybackProgress(ActivityState.PLAYBACK)
      }

      /** Pause subsequent play back */
      ActivityState.PLAYBACK_PAUSED -> {
        setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, nextBtnState)
        mediaPlayer!!.pause()
      }

      /** Activity stopped */
      ActivityState.ACTIVITY_STOPPED -> {}
    }
  }

  /** Handle play button click */
  private fun handlePlayClick() {
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
      ActivityState.INIT, ActivityState.ACTIVITY_STOPPED -> {}
    }
  }

  /** Handle next button click */
  private fun handleNextClick() {
    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    /** Disable all buttons */
    setButtonStates(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED)

    if (activityState == ActivityState.PLAYBACK) {
      mediaPlayer!!.stop()
    }
    mediaPlayer!!.release()
    mediaPlayer = null

    val accuracy =
      when (accuracyRating) {
        R.string.accuracy_correct -> 2
        R.string.accuracy_errors -> 1
        else -> 0
      }

    val quality =
      when (qualityRating) {
        R.string.quality_good -> 2
        R.string.quality_noisy -> 1
        else -> 0
      }

    val volume =
      when (volumeRating) {
        R.string.volume_high -> 2
        R.string.volume_okay -> 1
        else -> 0
      }

    outputData.addProperty("accuracy", accuracy)
    outputData.addProperty("quality", quality)
    outputData.addProperty("volume", volume)

    ioScope.launch {
      completeAndSaveCurrentMicrotask()
      setActivityState(ActivityState.INIT)
      moveToNextMicrotask()
    }
  }

  /** Handle back button click */
  private fun handleBackClick() {}

  /** Set button states */
  private fun setButtonStates(
    backState: ButtonState,
    playState: ButtonState,
    nextState: ButtonState,
  ) {
    backBtnState = backState
    playBtnState = playState
    nextBtnState = nextState
    flushButtonStates()
  }

  /** Flush the button states */
  private fun flushButtonStates() {
    playBtn.isClickable = playBtnState != ButtonState.DISABLED
    backBtn.isClickable = backBtnState != ButtonState.DISABLED
    nextBtn.isClickable = nextBtnState != ButtonState.DISABLED

    playBtn.setBackgroundResource(
      when (playBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_speaker_disabled
        ButtonState.ENABLED -> R.drawable.ic_speaker_enabled
        ButtonState.ACTIVE -> R.drawable.ic_speaker_active
      }
    )

    nextBtn.setBackgroundResource(
      when (nextBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_next_disabled
        ButtonState.ENABLED -> R.drawable.ic_next_enabled
        ButtonState.ACTIVE -> R.drawable.ic_next_enabled
      }
    )

    backBtn.setBackgroundResource(
      when (backBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_back_disabled
        ButtonState.ENABLED -> R.drawable.ic_back_enabled
        ButtonState.ACTIVE -> R.drawable.ic_back_enabled
      }
    )
  }

  /** Disable reviewing */
  private fun disableReview() {
    accuracyCorrectBtn.isEnabled = false
    accuracyErrorsBtn.isEnabled = false
    accuracyIncorrectBtn.isEnabled = false

    qualityGoodBtn.isEnabled = false
    qualityNoisyBtn.isEnabled = false
    qualityBadBtn.isEnabled = false

    volumeHighBtn.isEnabled = false
    volumeOkayBtn.isEnabled = false
    volumeLowBtn.isEnabled = false
  }

  /** Enable reviewing */
  private fun enableReviewing() {
    accuracyCorrectBtn.isEnabled = true
    accuracyErrorsBtn.isEnabled = true
    accuracyIncorrectBtn.isEnabled = true

    qualityGoodBtn.isEnabled = true
    qualityNoisyBtn.isEnabled = true
    qualityBadBtn.isEnabled = true

    volumeHighBtn.isEnabled = true
    volumeOkayBtn.isEnabled = true
    volumeLowBtn.isEnabled = true
  }

  /** Handle accuracy change */
  private fun handleAccuracyChange(@StringRes accuracy: Int) {
    accuracyRating = accuracy
    accuracyCorrectBtn.setTextColor(Color.parseColor("#000000"))
    accuracyIncorrectBtn.setTextColor(Color.parseColor("#000000"))
    accuracyErrorsBtn.setTextColor(Color.parseColor("#000000"))

    if (accuracy != R.string.rating_undefined) {
      when (accuracy) {
        R.string.accuracy_correct -> accuracyCorrectBtn
        R.string.accuracy_errors -> accuracyErrorsBtn
        R.string.accuracy_incorrect -> accuracyIncorrectBtn
        else -> accuracyIncorrectBtn
      }.setTextColor(Color.parseColor("#33CC33"))
    }

    updateReviewStatus()
  }

  /** Handle quality change */
  private fun handleQualityChange(@StringRes quality: Int) {
    qualityRating = quality
    qualityGoodBtn.setTextColor(Color.parseColor("#000000"))
    qualityBadBtn.setTextColor(Color.parseColor("#000000"))
    qualityNoisyBtn.setTextColor(Color.parseColor("#000000"))

    if (quality != R.string.rating_undefined) {
      when (quality) {
        R.string.quality_good -> qualityGoodBtn
        R.string.quality_noisy -> qualityNoisyBtn
        R.string.quality_bad -> qualityBadBtn
        else -> qualityBadBtn
      }.setTextColor(Color.parseColor("#33CC33"))
    }

    updateReviewStatus()
  }

  /** Handle volume change */
  private fun handleVolumeChange(@StringRes volume: Int) {
    volumeRating = volume
    volumeHighBtn.setTextColor(Color.parseColor("#000000"))
    volumeLowBtn.setTextColor(Color.parseColor("#000000"))
    volumeOkayBtn.setTextColor(Color.parseColor("#000000"))

    if (volume != R.string.rating_undefined) {
      when (volume) {
        R.string.volume_high -> volumeHighBtn
        R.string.volume_okay -> volumeOkayBtn
        R.string.volume_low -> volumeLowBtn
        else -> volumeLowBtn
      }.setTextColor(Color.parseColor("#33CC33"))
    }

    updateReviewStatus()
  }

  private fun updateReviewStatus() {
    reviewCompleted =
      accuracyRating != R.string.rating_undefined &&
        qualityRating != R.string.rating_undefined &&
        volumeRating != R.string.rating_undefined

    if (reviewCompleted) {
      setButtonStates(ButtonState.ENABLED, ButtonState.ENABLED, ButtonState.ENABLED)
    }
  }

  /** Update the progress bar for the player as long as the activity is in the specific state. */
  private fun updatePlaybackProgress(state: ActivityState) {
    val runnable = Runnable {
      while (state == activityState) {
        val currentPosition =
          try {
            mediaPlayer?.currentPosition
          } catch (e: Exception) {
            null
          }
        playbackProgressPb.progress = currentPosition ?: playbackProgressPb.progress
        Thread.sleep(100)
      }
    }
    playbackProgressThread = Thread(runnable)
    playbackProgressThread.start()
  }

  /** Reset recording length */
  private fun resetRecordingLength(duration: Int) {
    uiScope.launch {
      val centiSeconds = (duration / 10) % 100
      val seconds = duration / 1000
      playbackSecondsTv.text = "%d".format(seconds)
      playbackCentiSecondsTv.text = "%02d".format(centiSeconds)
    }
  }
}
