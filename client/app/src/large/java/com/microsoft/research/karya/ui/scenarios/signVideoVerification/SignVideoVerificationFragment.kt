package com.microsoft.research.karya.ui.scenarios.signVideoVerification

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
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.signVideoVerification.SignVideoVerificationViewModel.ButtonState.DISABLED
import com.microsoft.research.karya.ui.scenarios.signVideoVerification.SignVideoVerificationViewModel.ButtonState.ENABLED
import com.microsoft.research.karya.utils.extensions.hideKeyboard
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.large.microtask_sign_video_verification.*
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*

@AndroidEntryPoint
class SignVideoVerificationFragment :
  BaseMTRendererFragment(R.layout.microtask_sign_video_verification) {
  override val viewModel: SignVideoVerificationViewModel by viewModels()
  val args: SignVideoVerificationFragmentArgs by navArgs()

  private fun setupObservers() {

    viewModel.oldRemarks.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { remarks ->
      feedbackEt.setText(remarks)
    }

    viewModel.nextBtnState.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { state ->
      nextBtnCv.isClickable = state != DISABLED
      nextBtnCv.nextIv.setBackgroundResource(
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

    /** grade instruction */
    val gradeInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString
    instructionTv.text = gradeInstruction

    setupObservers()
    /** Set OnBackPressed callback */
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) {
      freeResources()
      viewModel.onBackPressed()
    }

    /** Set on click listeners */
    nextBtnCv.setOnClickListener {
      // If not selected a grade, return
      if (viewModel.score == 0) { // TODO: Change this to enum
        Toast.makeText(requireContext(), "Please grade the student", Toast.LENGTH_LONG).show()
        return@setOnClickListener
      }
      viewModel.handleNextClick()
      resetUI()
    }

    feedbackEt.addTextChangedListener { editText ->
      viewModel.remarks = editText.toString()
    }

    ratingGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
      if (isChecked) {
        viewModel.score = when (checkedId) {
          R.id.videoPoorBtn -> 1
          R.id.videoAverageBtn -> 2
          R.id.videoGoodBtn -> 3
          else -> 0
        }
      }
    }
  }

  private fun resetUI() {
    feedbackEt.text.clear()
    ratingGroup.clearChecked()
    hideKeyboard()
  }

  private fun freeResources() {
    videoPlayer.releasePlayer()
  }
}

