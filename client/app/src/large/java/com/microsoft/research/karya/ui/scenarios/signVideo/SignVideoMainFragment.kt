package com.microsoft.research.karya.ui.scenarios.signVideo

import android.content.Intent
import android.os.Bundle
import android.util.DisplayMetrics
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.addCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.signVideo.SignVideoMainViewModel.ButtonState.DISABLED
import com.microsoft.research.karya.ui.scenarios.signVideo.SignVideoMainViewModel.ButtonState.ENABLED
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import com.potyvideo.library.globalInterfaces.AndExoPlayerListener
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_common_back_button.view.*
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*
import kotlinx.android.synthetic.main.microtask_sign_video_data.*

private const val testVideo: String ="""<iframe
width="100%"
height="100%"
src="https://www.youtube.com/embed/1QQrcTik1qo"
title="YouTube video player"
frameborder="0"
allowfullscreen
></iframe>"""

@AndroidEntryPoint
class SignVideoMainFragment : BaseMTRendererFragment(R.layout.microtask_sign_video_data) {
  override val viewModel: SignVideoMainViewModel by viewModels()
  val args: SignVideoMainFragmentArgs by navArgs()

  private var displayPlaceHolder: Boolean = true

  private val recordVideoLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->

      if (result.resultCode == AppCompatActivity.RESULT_OK) {
        viewModel.setVideoSource(viewModel.outputRecordingFilePath)

        viewModel.onVideoReceived()

        videoPlayer.startPlayer()
        videoPlayer.setShowControllers(false)
        videoPlayer.setAndExoPlayerListener(object : AndExoPlayerListener {
          override fun onExoEnded() {
            super.onExoEnded()
            viewModel.onPlayerEnded()
          }
        })
      }
    }

  override fun requiredPermissions(): Array<String> {
    return arrayOf(android.Manifest.permission.CAMERA)
  }

  private fun setupObservers() {

    viewModel.videoSource.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { source ->
      if (source.isNotEmpty()) {
        videoPlayer.setSource(source)
      }
    }

    viewModel.backBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
      backBtnCv.isClickable = state != DISABLED
      backBtnCv.backIv.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_back_disabled
          ENABLED -> R.drawable.ic_back_enabled
        }
      )
    }

    viewModel.recordBtnState.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { state ->
      recordBtn.isClickable = state != DISABLED
      recordBtn.alpha =
        when (state) {
          DISABLED -> 0.5F
          ENABLED -> 1F
        }
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

    viewModel.launchRecordVideo.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) {
      /** Determine action based on current state */
      val intent = Intent(requireContext(), SignVideoRecord::class.java)
      intent.putExtra("video_file_path", viewModel.outputRecordingFilePath)
      recordVideoLauncher.launch(intent)
    }

    viewModel.videoPlayerVisibility.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { visible ->
      if (visible) {
        displayPlaceHolder = false
        showVideoPlayer()
      } else {
        displayPlaceHolder = true
        showTextPlaceHolder()
      }
    }

    viewModel.sentenceTvText.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { text ->
      sentenceTv.text = text
    }


  }

  private fun showVideoPlayer() {
    videoPlayer.visible()
    hintVideoPlayer.invisible()
    videoPlayerPlaceHolder.invisible()
    closeHintVideoBtn.invisible()
    showHintVideoBtn.visible()
  }

  private fun showTextPlaceHolder() {
    videoPlayer.invisible()
    hintVideoPlayer.invisible()
    videoPlayerPlaceHolder.visible()
    closeHintVideoBtn.invisible()
    showHintVideoBtn.visible()
  }

  private fun showHintVideoPlayer() {
    videoPlayer.invisible()
    hintVideoPlayer.visible()
    videoPlayerPlaceHolder.invisible()
    closeHintVideoBtn.visible()
    showHintVideoBtn.invisible()
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    viewModel.setupViewModel(args.taskId, args.completed, args.total)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()
    /** Set OnBackPressed callback */
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) { viewModel.onBackPressed() }

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString
        ?: "TEST INSTRUCTION (HARDCODED)"
    instructionTv.text = recordInstruction

    /** Set on click listeners */
    recordBtn.setOnClickListener {
      viewModel.handleRecordClick()
    }
    nextBtnCv.setOnClickListener { viewModel.handleNextClick() }
    backBtnCv.setOnClickListener { viewModel.handleBackClick() }

    showHintVideoBtn.setOnClickListener {
      showHintVideoBtn.invisible()
      closeHintVideoBtn.visible()
      showHintVideoPlayer()
    }

    closeHintVideoBtn.setOnClickListener {
      closeHintVideoBtn.invisible()
      showHintVideoBtn.visible()
      if (displayPlaceHolder) showTextPlaceHolder() else showVideoPlayer()
    }

    val displayMetrics = DisplayMetrics()
    requireActivity().windowManager.defaultDisplay.getRealMetrics(displayMetrics)
    val width = displayMetrics.widthPixels

    hintVideoPlayer.settings.javaScriptEnabled = true
    hintVideoPlayer.settings.loadWithOverviewMode = true
    hintVideoPlayer.settings.useWideViewPort = true
    hintVideoPlayer.loadData(testVideo, "text/html", null)
  }
}

