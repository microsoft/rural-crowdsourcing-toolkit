package com.microsoft.research.karya.ui.scenarios.speechVerification

import android.app.AlertDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainFragmentArgs
import com.microsoft.research.karya.ui.scenarios.speechVerification.SpeechVerificationViewModel.ButtonState
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_common_back_button.view.*
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*
import kotlinx.android.synthetic.main.microtask_common_playback_progress.view.*
import kotlinx.android.synthetic.main.microtask_speech_verification.*

@AndroidEntryPoint
class SpeechVerificationFragment : BaseMTRendererFragment(R.layout.microtask_speech_verification) {
  override val viewModel: SpeechVerificationViewModel by viewModels()
  val args: SpeechDataMainFragmentArgs by navArgs()

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewModel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupObservers()

    /** Set on click listeners for buttons */
    playBtn.setOnClickListener { viewModel.handlePlayClick() }
    nextBtnCv.setOnClickListener { viewModel.handleNextClick() }

    with (viewModel) {
      accuracyGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
        if (isChecked) {
          when (checkedId) {
            accuracyBadBtn.id -> handleAccuracyChange(R.string.accuracy_bad)
            accuracyOkayBtn.id -> handleAccuracyChange(R.string.accuracy_okay)
            accuracyGoodBtn.id -> handleAccuracyChange(R.string.accuracy_good)
          }
        }
      }

      qualityGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
        if (isChecked) {
          when (checkedId) {
            qualityBadBtn.id -> handleQualityChange(R.string.quality_bad)
            qualityOkayBtn.id -> handleQualityChange(R.string.quality_okay)
            qualityGoodBtn.id -> handleQualityChange(R.string.quality_good)
          }
        }
      }

      volumeGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
        if (isChecked) {
          when (checkedId) {
            volumeBadBtn.id -> handleVolumeChange(R.string.volume_bad)
            volumeOkayBtn.id -> handleVolumeChange(R.string.volume_okay)
            volumeGoodBtn.id -> handleVolumeChange(R.string.volume_good)
          }
        }
      }

      fluencyGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
        if (isChecked) {
          when (checkedId) {
            fluencyBadBtn.id -> handleFluencyChange(R.string.fluency_bad)
            fluencyOkayBtn.id -> handleFluencyChange(R.string.fluency_okay)
            fluencyGoodBtn.id -> handleFluencyChange(R.string.fluency_good)
          }
        }
      }
    }
  }

  private fun setupObservers() {

    viewModel.sentenceTvText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      sentenceTv.text = text
    }

    viewModel.playbackSecondsTvText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      playbackProgress.secondsTv.text = text
    }

    viewModel.playbackCentiSecondsTvText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      playbackProgress.centiSecondsTv.text = text
    }

    viewModel.playbackProgressPbMax.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { max ->
      playbackProgress.progressPb.max = max
    }

    viewModel.playbackProgress.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { progress ->
      playbackProgress.progressPb.progress = progress
    }

    viewModel.navAndMediaBtnGroup.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { states ->
      flushButtonStates(states.first, states.second, states.third)
    }

    viewModel.accuracyRating.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { value ->
      when (value) {
        R.string.accuracy_bad -> accuracyGroup.check(accuracyBadBtn.id)
        R.string.accuracy_okay -> accuracyGroup.check(accuracyOkayBtn.id)
        R.string.accuracy_good -> accuracyGroup.check(accuracyGoodBtn.id)
        else -> accuracyGroup.clearChecked()
      }
    }

    viewModel.qualityRating.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { value ->
      when (value) {
        R.string.quality_bad -> qualityGroup.check(qualityBadBtn.id)
        R.string.quality_okay -> qualityGroup.check(qualityOkayBtn.id)
        R.string.quality_good -> qualityGroup.check(qualityGoodBtn.id)
        else -> qualityGroup.clearChecked()
      }
    }

    viewModel.volumeRating.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { value ->
      when (value) {
        R.string.volume_bad -> volumeGroup.check(volumeBadBtn.id)
        R.string.volume_okay -> volumeGroup.check(volumeOkayBtn.id)
        R.string.volume_good -> volumeGroup.check(volumeGoodBtn.id)
        else -> volumeGroup.clearChecked()
      }
    }

    viewModel.fluencyRating.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { value ->
      when (value) {
        R.string.fluency_bad -> fluencyGroup.check(fluencyBadBtn.id)
        R.string.fluency_okay -> fluencyGroup.check(fluencyOkayBtn.id)
        R.string.fluency_good -> fluencyGroup.check(fluencyGoodBtn.id)
        else -> fluencyGroup.clearChecked()
      }
    }

    viewModel.reviewEnabled.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { enabled ->
      if (enabled) {
        enableReviewing()
      } else {
        disableReview()
      }
    }

    viewModel.showErrorWithDialog.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { msg ->
      if (msg.isNotEmpty()) {
        showErrorDialog(msg)
      }
    }


  }

  private fun showErrorDialog(msg: String) {
    val alertDialogBuilder = AlertDialog.Builder(requireContext())
    alertDialogBuilder.setMessage(msg)
    alertDialogBuilder.setNeutralButton("Ok") { _, _ ->
      viewModel.handleCorruptAudio()
    }
    val alertDialog = alertDialogBuilder.create()
    alertDialog.setCancelable(false)
    alertDialog.setCanceledOnTouchOutside(false)
    alertDialog.show()
  }

  /** Enable reviewing */
  private fun enableReviewing() {
    accuracyGoodBtn.enable()
    accuracyOkayBtn.enable()
    accuracyBadBtn.enable()

    qualityGoodBtn.enable()
    qualityOkayBtn.enable()
    qualityBadBtn.enable()

    volumeGoodBtn.enable()
    volumeOkayBtn.enable()
    volumeBadBtn.enable()

    fluencyBadBtn.enable()
    fluencyOkayBtn.enable()
    fluencyGoodBtn.enable()
  }

  /** Disable reviewing */
  private fun disableReview() {
    accuracyGoodBtn.disable()
    accuracyOkayBtn.disable()
    accuracyBadBtn.disable()

    qualityGoodBtn.disable()
    qualityOkayBtn.disable()
    qualityBadBtn.disable()

    volumeGoodBtn.disable()
    volumeOkayBtn.disable()
    volumeBadBtn.disable()

    fluencyBadBtn.disable()
    fluencyOkayBtn.disable()
    fluencyGoodBtn.disable()
  }

  /** Flush the button states */
  private fun flushButtonStates(
    backBtnState: ButtonState,
    playBtnState: ButtonState,
    nextBtnState: ButtonState
  ) {
    playBtn.isClickable = playBtnState != ButtonState.DISABLED
    backBtnCv.isClickable = backBtnState != ButtonState.DISABLED
    nextBtnCv.isClickable = nextBtnState != ButtonState.DISABLED

    playBtn.setBackgroundResource(
      when (playBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_speaker_disabled
        ButtonState.ENABLED -> R.drawable.ic_speaker_enabled
        ButtonState.ACTIVE -> R.drawable.ic_speaker_active
      }
    )

    nextBtnCv.nextIv.setBackgroundResource(
      when (nextBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_next_disabled
        ButtonState.ENABLED -> R.drawable.ic_next_enabled
        ButtonState.ACTIVE -> R.drawable.ic_next_enabled
      }
    )

    backBtnCv.backIv.setBackgroundResource(
      when (backBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_back_disabled
        ButtonState.ENABLED -> R.drawable.ic_back_enabled
        ButtonState.ACTIVE -> R.drawable.ic_back_enabled
      }
    )
  }

}
