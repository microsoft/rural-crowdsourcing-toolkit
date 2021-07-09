//package com.microsoft.research.karya.ui.scenarios.signVideo
//
//import android.content.Intent
//import android.os.Bundle
//import android.view.View
//import androidx.activity.addCallback
//import androidx.activity.result.contract.ActivityResultContracts
//import androidx.appcompat.app.AppCompatActivity
//import androidx.fragment.app.viewModels
//import androidx.navigation.fragment.navArgs
//import com.microsoft.research.karya.R
//import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
//import com.microsoft.research.karya.ui.scenarios.signVideo.SignVideoMainViewModel.ButtonState.DISABLED
//import com.microsoft.research.karya.ui.scenarios.signVideo.SignVideoMainViewModel.ButtonState.ENABLED
//import com.microsoft.research.karya.utils.extensions.invisible
//import com.microsoft.research.karya.utils.extensions.observe
//import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
//import com.microsoft.research.karya.utils.extensions.visible
//import com.potyvideo.library.globalInterfaces.AndExoPlayerListener
//import dagger.hilt.android.AndroidEntryPoint
//import kotlinx.android.synthetic.main.fragment_sign_video_init.*
//
//@AndroidEntryPoint
//class SignVideoMainFragment : BaseMTRendererFragment(R.layout.fragment_sign_video_init) {
//  override val viewModel: SignVideoMainViewModel by viewModels()
//  val args: SignVideoMainFragmentArgs by navArgs()
//
//  val recordVideoLauncher =
//    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
//
//      if (result.resultCode == AppCompatActivity.RESULT_OK) {
//        videoPlayer.setSource(viewModel.outputRecordingFilePath)
//
//        viewModel.onVideoReceived()
//
//        videoPlayer.startPlayer()
//        videoPlayer.setShowControllers(false)
//        videoPlayer.setAndExoPlayerListener(object : AndExoPlayerListener {
//          override fun onExoEnded() {
//            super.onExoEnded()
//            viewModel.onPlayerEnded()
//          }
//        })
//      }
//    }
//
//  override fun requiredPermissions(): Array<String> {
//    return arrayOf(android.Manifest.permission.CAMERA)
//  }
//
//  private fun setupObservers() {
//
//    viewModel.backBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
//      backBtn.isClickable = state != DISABLED
//      backBtn.setBackgroundResource(
//        when (state) {
//          DISABLED -> R.drawable.ic_back_disabled
//          ENABLED -> R.drawable.ic_back_enabled
//        }
//      )
//    }
//
//    viewModel.recordBtnState.observe(viewLifecycleOwner.lifecycle,
//      viewLifecycleScope) { state ->
//      recordBtn.isClickable = state != DISABLED
//      recordBtn.setBackgroundResource(
//        when (state) {
//          DISABLED -> R.drawable.ic_mic_disabled
//          ENABLED -> R.drawable.ic_mic_enabled
//        }
//      )
//    }
//
//    viewModel.nextBtnState.observe(
//      viewLifecycleOwner.lifecycle,
//      viewLifecycleScope) { state ->
//      nextBtn.isClickable = state != DISABLED
//      nextBtn.setBackgroundResource(
//        when (state) {
//          DISABLED -> R.drawable.ic_next_disabled
//          ENABLED -> R.drawable.ic_next_enabled
//        }
//      )
//    }
//
//    viewModel.launchRecordVideo.observe(
//      viewLifecycleOwner.lifecycle,
//      viewLifecycleScope
//    ) { navigate ->
//      /** Determine action based on current state */
//      val intent = Intent(requireContext(), SignVideoRecord::class.java)
//      intent.putExtra("video_file_path", viewModel.outputRecordingFilePath)
//      recordVideoLauncher.launch(intent)
//    }
//
//    viewModel.videoPlayerVisibility.observe(
//      viewLifecycleOwner.lifecycle,
//      viewLifecycleScope
//    ) { visible ->
//      if (visible) {
//        showVideoPlayer()
//      } else {
//        hideVideoPlayer()
//      }
//    }
//
//    viewModel.sentenceTvText.observe(
//      viewLifecycleOwner.lifecycle,
//      viewLifecycleScope
//    ) { text ->
//      sentenceTv.text = text
//    }
//
//
//  }
//
//  private fun showVideoPlayer() {
//    videoPlayer.visible()
//    videoPlayerPlaceHolder.invisible()
//  }
//
//  private fun hideVideoPlayer() {
//    videoPlayer.invisible()
//    videoPlayerPlaceHolder.visible()
//  }
//
//  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
//    super.onViewCreated(view, savedInstanceState)
//
//    setupObservers()
//    /** Set OnBackPressed callback */
//    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) { viewModel.onBackPressed() }
//
//    /** record instruction */
//    val recordInstruction =
//      viewModel.task.params.asJsonObject.get("instruction").asString
//        ?: "TEST INSTRUCTION (HARDCODED)"
//    recordPromptTv.text = recordInstruction
//
//    /** Forced replace */
//    val noForcedReplay =
//      try {
//        viewModel.task.params.asJsonObject.get("noForcedReplay").asBoolean
//      } catch (e: Exception) {
//        false
//      }
//
//    /** Set on click listeners */
//    recordBtn.setOnClickListener { viewModel.handleRecordClick() }
//    nextBtn.setOnClickListener { viewModel.handleNextClick() }
//    backBtn.setOnClickListener { viewModel.handleBackClick() }
//  }
//}
//
