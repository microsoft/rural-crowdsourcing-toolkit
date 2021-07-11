package com.microsoft.research.karya.ui.scenarios.signVideoVerification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.SeekBar
import androidx.activity.addCallback
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.signVideoVerification.SignVideoVerificationViewModel.ButtonState.DISABLED
import com.microsoft.research.karya.ui.scenarios.signVideoVerification.SignVideoVerificationViewModel.ButtonState.ENABLED
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.fragment_sign_video_verification.*

@AndroidEntryPoint
class SIgnVideoVerificationFragment :
  BaseMTRendererFragment(R.layout.fragment_sign_video_verification) {
  override val viewModel: SignVideoVerificationViewModel by viewModels()
  val args: SIgnVideoVerificationFragmentArgs by navArgs()

  private fun setupObservers() {

    viewModel.backBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
      backBtn.isClickable = state != DISABLED
      backBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_back_disabled
          ENABLED -> R.drawable.ic_back_enabled
        }
      )
    }

    viewModel.nextBtnState.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { state ->
      nextBtn.isClickable = state != DISABLED
      nextBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_next_disabled
          ENABLED -> R.drawable.ic_next_enabled
        }
      )
    }

    viewModel.videoPlayerVisibility.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { visible ->
      if (visible) {
        showVideoPlayer()
      } else {
        hideVideoPlayer()
      }
    }

    viewModel.recordingFile.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { filePath ->
       if (filePath.isNotEmpty()) videoPlayer.setSource(filePath)
    }

    viewModel.sentenceTvText.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { text ->
      if (text.isNotEmpty()) sentenceTv.text = text
    }


  }

  private fun showVideoPlayer() {
    videoPlayer.visible()
    videoPlayerPlaceHolder.invisible()
  }

  private fun hideVideoPlayer() {
    videoPlayer.invisible()
    videoPlayerPlaceHolder.visible()
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewModel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()
    /** Set OnBackPressed callback */
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) {
      freeResources()
      viewModel.onBackPressed()
    }

    /** Forced replace */
    val noForcedReplay =
      try {
        viewModel.task.params.asJsonObject.get("noForcedReplay").asBoolean
      } catch (e: Exception) {
        false
      }

    /** Set on click listeners */
    nextBtn.setOnClickListener {
      viewModel.remarks = feedbackEt.text.toString()
      viewModel.handleNextClick()
    }
    backBtn.setOnClickListener { viewModel.handleBackClick() }

    scoreSlider.setOnSeekBarChangeListener(object :
      SeekBar.OnSeekBarChangeListener {
      override fun onProgressChanged(
        seek: SeekBar,
        progress: Int, fromUser: Boolean
      ) {
        // write custom code for progress is changed
      }

      override fun onStartTrackingTouch(seek: SeekBar) {
        // write custom code for progress is started
      }

      override fun onStopTrackingTouch(seek: SeekBar) {
        // write custom code for progress is stopped
        val score = seek.progress
        scoreTextView.text = score.toString()
        viewModel.score = score
      }
    })

  }

  private fun freeResources() {
    videoPlayer.releasePlayer()
  }
}

