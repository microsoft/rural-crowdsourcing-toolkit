package com.microsoft.research.karya.ui.scenarios.speechVerification

import android.app.AlertDialog
import android.graphics.Color
import android.media.MediaPlayer
import androidx.annotation.StringRes
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SpeechVerificationViewModel
@Inject
constructor(
    assignmentRepository: AssignmentRepository,
    taskRepository: TaskRepository,
    microTaskRepository: MicroTaskRepository,
    @FilesDir fileDirPath: String,
    authManager: AuthManager,
) : BaseMTRendererViewModel(
    assignmentRepository,
    taskRepository,
    microTaskRepository,
    fileDirPath,
    authManager
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

    /** Media player */
    private var mediaPlayer: MediaPlayer? = null

    /** UI State */
    private var activityState: ActivityState = ActivityState.INIT
    private var previousActivityState: ActivityState = ActivityState.INIT
    private var playBtnState: ButtonState = ButtonState.DISABLED
    private var nextBtnState: ButtonState = ButtonState.DISABLED
    private var backBtnState: ButtonState = ButtonState.DISABLED

    /** Verification status */
    @StringRes
    private var accuracyRating = R.string.rating_undefined

    @StringRes
    private var qualityRating = R.string.rating_undefined

    @StringRes
    private var volumeRating = R.string.rating_undefined
    private var reviewCompleted = false

    private lateinit var playbackProgressThread: Thread
    private val GREEN_COLOR = Color.parseColor("#33CC33")

    // Defining Mutable State Flows
    private val _sentenceTvText: MutableStateFlow<String>
        = MutableStateFlow("")
    val sentenceTvText = _sentenceTvText.asStateFlow()

    private val _playbackSecondsTvText: MutableStateFlow<String>
        = MutableStateFlow("")
    val playbackSecondsTvText = _playbackSecondsTvText.asStateFlow()

    private val _playbackCentiSecondsTvText: MutableStateFlow<String>
        = MutableStateFlow("")
    val playbackCentiSecondsTvText = _playbackCentiSecondsTvText.asStateFlow()

    private val _playbackProgressPbMax: MutableStateFlow<Int>
        = MutableStateFlow(0)
    val playbackProgressPbMax = _playbackProgressPbMax.asStateFlow()

    private val _playbackProgress: MutableStateFlow<Int>
        = MutableStateFlow(0)
    val playbackProgress = _playbackProgress.asStateFlow()

    private val _navAndMediaBtnGroup: MutableStateFlow<Triple<ButtonState, ButtonState, ButtonState>>
        = MutableStateFlow(Triple(ButtonState.DISABLED, ButtonState.DISABLED, ButtonState.DISABLED))
    // Button State Order: PlayButton, NextButton, BackButton
    val navAndMediaBtnGroup = _navAndMediaBtnGroup.asStateFlow()

    private val _accuracyGroupBtnColor: MutableStateFlow<Triple<Int, Int, Int>>
        = MutableStateFlow(Triple(Color.BLACK, Color.BLACK, Color.BLACK))
    // Color State Order: accurate, incorrect, error
    val accuracyGroupBtnColor = _accuracyGroupBtnColor.asStateFlow()

    private val _qualityGroupBtnColor: MutableStateFlow<Triple<Int, Int, Int>>
        = MutableStateFlow(Triple(Color.BLACK, Color.BLACK, Color.BLACK))
    // Color State Order: good, bad, noisy
    val qualityGroupBtnColor = _qualityGroupBtnColor.asStateFlow()

    private val _volumeGroupBtnColor: MutableStateFlow<Triple<Int, Int, Int>>
        = MutableStateFlow(Triple(Color.BLACK, Color.BLACK, Color.BLACK))
    // Color State Order: Volume High, Volume Okay, Volume Low
    val volumeGroupBtnColor = _volumeGroupBtnColor.asStateFlow()

    private val _reviewEnabled: MutableStateFlow<Boolean>
        = MutableStateFlow(false)
    val reviewEnabled = _reviewEnabled.asStateFlow()

    private val _showErrorWithDialog: MutableStateFlow<String>
        = MutableStateFlow("")
    val showErrorWithDialog = _showErrorWithDialog.asStateFlow()

    override fun setupMicrotask() {
        handleAccuracyChange(R.string.rating_undefined)
        handleQualityChange(R.string.rating_undefined)
        handleVolumeChange(R.string.rating_undefined)

        _reviewEnabled.value = false
        reviewCompleted = false

        val sentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").toString()
        val recordingFileName = currentMicroTask.input.asJsonObject.getAsJsonObject("files").get("recording").asString
        val recordingFile = microtaskInputContainer.getMicrotaskInputFilePath(currentMicroTask.id, recordingFileName)

        _sentenceTvText.value = sentence

        /** setup media player */
        mediaPlayer = MediaPlayer()
        mediaPlayer!!.setOnCompletionListener { setActivityState(ActivityState.REVIEW_ENABLED) }
        mediaPlayer!!.setDataSource(recordingFile)

        try {
            mediaPlayer!!.prepare()
            resetRecordingLength(mediaPlayer!!.duration)
            _playbackProgressPbMax.value = mediaPlayer!!.duration
            _playbackProgress.value = 0

            setActivityState(ActivityState.WAIT_FOR_PLAY)
        } catch (exception: Exception) {
            // Alert dialog
            showErrorWithDialogBox("Audio file is corrupt")
        }
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
                _reviewEnabled.value = true
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
            ActivityState.INIT, ActivityState.ACTIVITY_STOPPED -> {}
        }
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

        viewModelScope.launch {
            completeAndSaveCurrentMicrotask()
            setActivityState(ActivityState.INIT)
            moveToNextMicrotask()
        }
    }

    /** Set button states */
    private fun setButtonStates(
        backState: ButtonState,
        playState: ButtonState,
        nextState: ButtonState,
    ) {
        _navAndMediaBtnGroup.value = Triple(backState, playState, nextState)
    }


    /** Handle accuracy change */
     fun handleAccuracyChange(@StringRes accuracy: Int) {
        accuracyRating = accuracy
        var accuracyBtnColor: Int = Color.parseColor("#000000")
        var accuracyIncorrectBtnColor:Int = Color.parseColor("#000000")
        var accuracyErrorsBtnColor:Int = Color.parseColor("#000000")

        if (accuracy != R.string.rating_undefined) {
            when (accuracy) {
                R.string.accuracy_correct -> accuracyBtnColor = GREEN_COLOR
                R.string.accuracy_incorrect -> accuracyIncorrectBtnColor = GREEN_COLOR
                R.string.accuracy_errors -> accuracyErrorsBtnColor = GREEN_COLOR
                else -> accuracyIncorrectBtnColor = GREEN_COLOR
            }
        }

        _accuracyGroupBtnColor.value =
            Triple(accuracyBtnColor, accuracyIncorrectBtnColor, accuracyErrorsBtnColor)

        updateReviewStatus()
    }

    /** Handle quality change */
     fun handleQualityChange(@StringRes quality: Int) {
        qualityRating = quality
        var qualityGoodBtnColor: Int = Color.parseColor("#000000")
        var qualityBadBtnColor:Int = Color.parseColor("#000000")
        var qualityNoisyBtnColor:Int = Color.parseColor("#000000")



        if (quality != R.string.rating_undefined) {
            when (quality) {
                R.string.quality_good-> qualityGoodBtnColor = GREEN_COLOR
                R.string.quality_bad -> qualityBadBtnColor = GREEN_COLOR
                R.string.quality_noisy -> qualityNoisyBtnColor = GREEN_COLOR
                else -> qualityBadBtnColor = GREEN_COLOR
            }
        }

        _qualityGroupBtnColor.value =
            Triple(qualityGoodBtnColor, qualityBadBtnColor, qualityNoisyBtnColor)

        updateReviewStatus()
    }

    /** Handle volume change */
    fun handleVolumeChange(@StringRes volume: Int) {
        volumeRating = volume
        var volumeHighBtnColor: Int = Color.parseColor("#000000")
        var volumeLowBtnColor:Int = Color.parseColor("#000000")
        var volumeOkayBtnColor:Int = Color.parseColor("#000000")



        if (volume != R.string.rating_undefined) {
            when (volume) {
                R.string.volume_high -> volumeHighBtnColor = GREEN_COLOR
                R.string.volume_okay -> volumeOkayBtnColor = GREEN_COLOR
                R.string.volume_low -> volumeLowBtnColor = GREEN_COLOR
                else -> volumeLowBtnColor = GREEN_COLOR
            }
        }

        _volumeGroupBtnColor.value =
            Triple(volumeHighBtnColor, volumeOkayBtnColor, volumeLowBtnColor, )

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
                _playbackProgress.value = currentPosition ?: _playbackProgress.value
                Thread.sleep(100)
            }
        }
        playbackProgressThread = Thread(runnable)
        playbackProgressThread.start()
    }

    /** Reset recording length */
    private fun resetRecordingLength(duration: Int) {
        viewModelScope.launch {
            val centiSeconds = (duration / 10) % 100
            val seconds = duration / 1000
            _playbackSecondsTvText.value = "%d".format(seconds)
            _playbackSecondsTvText.value = "%02d".format(centiSeconds)
        }
    }

    // Handle the corrupt Audio Case
    fun handleCorruptAudio() {
        // Give 2 on all reports
        accuracyRating = R.string.accuracy_incorrect
        volumeRating = R.string.volume_low
        qualityRating = R.string.quality_bad

        outputData.addProperty("flag", "corrupt")

        // Move to next task
        handleNextClick()
    }

}

