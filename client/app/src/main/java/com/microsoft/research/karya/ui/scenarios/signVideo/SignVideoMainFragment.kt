package com.microsoft.research.karya.ui.scenarios.signVideo

import android.content.Intent
import android.os.Bundle
import android.os.FileUtils
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.addCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
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
import kotlinx.android.synthetic.main.fragment_sign_video_init.*
import kotlinx.coroutines.launch

@AndroidEntryPoint
class SignVideoMainFragment : BaseMTRendererFragment(R.layout.fragment_sign_video_init) {
  override val viewModel: SignVideoMainViewModel by viewModels()
  val args: SignVideoMainFragmentArgs by navArgs()

  val recordVideoLauncher =
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
      backBtn.isClickable = state != DISABLED
      backBtn.setBackgroundResource(
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
      nextBtn.isClickable = state != DISABLED
      nextBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_next_disabled
          ENABLED -> R.drawable.ic_next_enabled
        }
      )
    }

    viewModel.launchRecordVideo.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { navigate ->
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
        showVideoPlayer()
      } else {
        hideVideoPlayer()
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

    setupObservers()
    /** Set OnBackPressed callback */
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) { viewModel.onBackPressed() }

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString
        ?: "TEST INSTRUCTION (HARDCODED)"
    recordPromptTv.text = recordInstruction

    /** Set on click listeners */
    recordBtn.setOnClickListener {
      viewModel.handleRecordClick()
    }
    nextBtn.setOnClickListener { viewModel.handleNextClick() }
    backBtn.setOnClickListener { viewModel.handleBackClick() }
  }

  /** TODO: Removing skip functionality for now */
  private fun buildAlertBox() {
    val builder = AlertDialog.Builder(requireContext())
    //set title for alert dialog
    builder.setTitle(R.string.dialogTitle)
    //set message for alert dialog
    builder.setMessage(R.string.dialogMessage)
    builder.setIcon(android.R.drawable.ic_dialog_alert)
    // Do this later option
    builder.setPositiveButton("Do this later") { dialog, _ ->
      viewModel.moveToNextTask()
      dialog.cancel()
    }
    // Skip Option
    builder.setNegativeButton("SKIP") { dialog, _ ->
      viewLifecycleScope.launch {
        viewModel.skipTask()
        dialog.cancel()
      }
    }
    // Create the AlertDialog
    val alertDialog: AlertDialog = builder.create()
    // Set other dialog properties
    alertDialog.setCancelable(true)
    alertDialog.show()
  }
}

