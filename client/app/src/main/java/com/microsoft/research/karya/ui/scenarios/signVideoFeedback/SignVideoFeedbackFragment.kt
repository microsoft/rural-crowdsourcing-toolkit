package com.microsoft.research.karya.ui.scenarios.signVideoFeedback

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.addCallback
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseFeedbackRendererFragment
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.fragment_sign_video_feedback.*

@AndroidEntryPoint
class SignVideoFeedbackFragment :
  BaseFeedbackRendererFragment(R.layout.fragment_sign_video_feedback) {
  override val viewModel: SignVideoFeedbackViewModel by viewModels()
  val args: SignVideoFeedbackFragmentArgs by navArgs()

  private fun setupObservers() {

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

    viewModel.score.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { score ->
      scoreTv.text = when (score) {
        3 -> "Good"
        2 -> "Okay"
        1 -> "Bad"
        else -> ""
      }
    }

    viewModel.remarks.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) {
        text -> feedbackTv.text = text
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
    viewModel.setupViewModel(args.taskId, 0)
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

    /** Set on click listeners */
    nextBtn.setOnClickListener {
      viewModel.handleNextClick()
    }

    backBtn.setOnClickListener {
      viewModel.handleBackClick()
    }
  }

  private fun freeResources() {
    videoPlayer.releasePlayer()
  }
}

