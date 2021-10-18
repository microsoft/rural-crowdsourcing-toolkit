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
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
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

    /** Set corner radius for button */
    playBtnCv.addOnLayoutChangeListener { _: View, left: Int, _: Int, right: Int, _: Int, _: Int, _: Int, _: Int, _: Int
      ->
      playBtnCv.radius = (right - left).toFloat() / 2
    }

    /** Set on click listeners for buttons */
    playBtn.setOnClickListener { viewModel.handlePlayClick() }
    nextBtn.setOnClickListener { viewModel.handleNextClick() }

    /** Set on click listeners for review buttons */
    with(viewModel) {
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
      playbackSecondsTv.text = text
    }

    viewModel.playbackCentiSecondsTvText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      playbackCentiSecondsTv.text = text
    }

    viewModel.playbackProgressPbMax.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { max ->
      playbackProgressPb.max = max
    }

    viewModel.playbackProgress.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { progress ->
      playbackProgressPb.progress = progress
    }

    viewModel.navAndMediaBtnGroup.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { states ->
      flushButtonStates(states.first, states.second, states.third)
    }

    viewModel.accuracyGroupBtnColor.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { colors ->
      accuracyCorrectBtn.setTextColor(colors.first)
      accuracyIncorrectBtn.setTextColor(colors.second)
      accuracyErrorsBtn.setTextColor(colors.third)
    }

    viewModel.qualityGroupBtnColor.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { colors ->
      qualityGoodBtn.setTextColor(colors.first)
      qualityBadBtn.setTextColor(colors.second)
      qualityNoisyBtn.setTextColor(colors.third)
    }

    viewModel.volumeGroupBtnColor.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { colors ->
      volumeHighBtn.setTextColor(colors.first)
      volumeOkayBtn.setTextColor(colors.second)
      volumeLowBtn.setTextColor(colors.third)
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

  /** Flush the button states */
  private fun flushButtonStates(
    playBtnState: ButtonState,
    backBtnState: ButtonState,
    nextBtnState: ButtonState
  ) {
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
        SpeechVerificationViewModel.ButtonState.DISABLED -> R.drawable.ic_next_disabled
        SpeechVerificationViewModel.ButtonState.ENABLED -> R.drawable.ic_next_enabled
        SpeechVerificationViewModel.ButtonState.ACTIVE -> R.drawable.ic_next_enabled
      }
    )

    backBtn.setBackgroundResource(
      when (backBtnState) {
        SpeechVerificationViewModel.ButtonState.DISABLED -> R.drawable.ic_back_disabled
        SpeechVerificationViewModel.ButtonState.ENABLED -> R.drawable.ic_back_enabled
        SpeechVerificationViewModel.ButtonState.ACTIVE -> R.drawable.ic_back_enabled
      }
    )
  }

}
