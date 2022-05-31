package com.microsoft.research.karya.ui.scenarios.imageData

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.ImageUtils.bitmapFromFile
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import com.otaliastudios.cameraview.CameraListener
import com.otaliastudios.cameraview.CameraOptions
import com.otaliastudios.cameraview.PictureResult
import com.otaliastudios.cameraview.gesture.Gesture
import com.otaliastudios.cameraview.gesture.GestureAction
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*
import kotlinx.android.synthetic.main.microtask_image_data.*
import java.io.File
import kotlin.math.max

@AndroidEntryPoint
class ImageDataFragment : BaseMTRendererFragment(R.layout.microtask_image_data) {
  override val viewModel: ImageDataViewModel by viewModels()
  private val args: ImageDataFragmentArgs by navArgs()

  private var localImageState: MutableList<Boolean> = mutableListOf()
  private var currentImageIndex: Int = 0
  private lateinit var imageListAdapter: ImageListAdapter

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

    cameraCv.pictureMetering = false
    cameraCv.mapGesture(Gesture.TAP, GestureAction.AUTO_FOCUS)

    setupObservers()
    setupListeners()
  }

  override fun requiredPermissions(): Array<String> {
    return arrayOf(android.Manifest.permission.CAMERA)
  }

  private fun setupObservers() {
    viewModel.newImageCount.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { pair ->
      val count = pair.second
      localImageState.clear()
      for (i in 0..count-1) {
        val outputFilePath = viewModel.outputFilePath(i)
        localImageState.add(File(outputFilePath).exists())
      }

      val instruction = getString(R.string.image_data_collection_instruction).replace("#", (count - 1).toString())
      instructionTv.text = instruction

      // Reinitialize state
      resetAdapter()

      updateNavigationState()
    }
  }

  private fun setupListeners() {
    // Camera event listeners
    cameraCv.addCameraListener(object : CameraListener() {
      // When camera is opened, make capture view visible
      override fun onCameraOpened(options: CameraOptions) {
        super.onCameraOpened(options)
        switchToCaptureView()
      }

      // Enable start capture button, after camera is closed
      override fun onCameraClosed() {
        super.onCameraClosed()
        startCaptureBtn.enable()
        recaptureBtn.enable()
      }

      // When picture is taken, move it to the correct file
      override fun onPictureTaken(result: PictureResult) {
        super.onPictureTaken(result)
        val imagePath = viewModel.outputFilePath(currentImageIndex)
        result.toFile(File(imagePath)) { file ->
          if (file != null) {
            localImageState[currentImageIndex] = true
            updateAdapter(currentImageIndex)

            // Show a toast to indicate that the picuture is taken
            if (currentImageIndex < localImageState.lastIndex && !localImageState[currentImageIndex + 1]) {
              val toastText: String = if (currentImageIndex == 0) {
                "Picture taken. Move to a random page and take a picture."
              } else {
                "Picture taken. Take picture of the next page."
              }
              Toast.makeText(requireContext(), toastText, Toast.LENGTH_LONG).show()
            }

            moveToNextImage()
            takePictureBtn.enable()
          }
        }
      }
    })

    // When the capture button is clicked
    startCaptureBtn.setOnClickListener {
      val index = localImageState.indexOf(false)
      currentImageIndex = max(index, 0)
      startCaptureBtn.disable()
      recaptureBtn.disable()
      cameraCv.open()
    }

    // When take picture button is clicked, take picture
    takePictureBtn.setOnClickListener {
      takePictureBtn.disable()
      cameraCv.takePicture()
    }

    // When the back to grid button is clicked
    backToGridViewBtn.setOnClickListener {
      switchToGridView()
    }

    nextBtnCv.setOnClickListener {
      viewModel.completeDataCollection(localImageState)
    }

    closeFullImageViewBtn.setOnClickListener {
      switchToGridView()
    }

    recaptureBtn.setOnClickListener {
      recaptureBtn.disable()
      startCaptureBtn.disable()
      cameraCv.open()
    }

    nextImageCv.setOnClickListener {
      if (currentImageIndex < localImageState.lastIndex && localImageState[currentImageIndex + 1]) {
        currentImageIndex++
        updateFullImageView()
      } else {
        switchToGridView()
      }
    }

    previousImageCv.setOnClickListener {
      if (currentImageIndex > 0 && localImageState[currentImageIndex - 1]) {
        currentImageIndex--
        updateFullImageView()
      } else {
        switchToGridView()
      }
    }

    backBtn.setOnClickListener { }
  }

  private fun updateNavigationState() {
    val complete = localImageState.all { it }
    if (complete) {
      nextBtnCv.isClickable = true
      nextBtnCv.nextIv.setBackgroundResource(R.drawable.ic_next_enabled)
    } else {
      nextBtnCv.isClickable = false
      nextBtnCv.nextIv.setBackgroundResource(R.drawable.ic_next_disabled)
    }
  }

  private fun switchToGridView() {
    updateNavigationState()
    imageDataCaptureView.invisible()
    fullImageDisplayView.invisible()
    imageDataGridView.visible()
    cameraCv.close()
  }

  private fun switchToCaptureView() {
    imageDataGridView.invisible()
    fullImageDisplayView.invisible()
    imageDataCaptureView.visible()
    val label = if (currentImageIndex == 0) "Front Cover" else "Picture $currentImageIndex"
    imageLabelTv.text = label
  }

  private fun switchToFullImageDisplayView() {
    imageDataCaptureView.invisible()
    imageDataGridView.invisible()
    fullImageDisplayView.visible()
    updateFullImageView()
  }

  private fun moveToNextImage() {
    currentImageIndex++
    while (currentImageIndex < localImageState.size && localImageState[currentImageIndex]) {
      currentImageIndex++
    }
    if (currentImageIndex >= localImageState.size) {
      currentImageIndex = 0
      switchToGridView()
    } else {
      val label = if (currentImageIndex == 0) "Front Cover" else "Picture $currentImageIndex"
      imageLabelTv.text = label
    }
  }

  private fun resetAdapter() {
    val pathList: MutableList<String> = localImageState.mapIndexed { index, present ->
      when (present) {
        false -> ""
        true -> viewModel.outputFilePath(index)
      }
    }.toMutableList()

    imageListAdapter = ImageListAdapter(requireContext(), pathList) { index ->
      handleGridImageClick(index)
    }
    imagesGv.adapter = imageListAdapter
  }

  private fun updateAdapter(index: Int) {
    val path = when (localImageState[index]) {
      false -> ""
      true -> viewModel.outputFilePath(index)
    }
    imageListAdapter.updateItem(index, path)
  }

  private fun handleGridImageClick(index: Int) {
    currentImageIndex = index
    if (localImageState[index]) {
      switchToFullImageDisplayView()
    } else {
      recaptureBtn.disable()
      startCaptureBtn.disable()
      cameraCv.open()
    }
  }

  private fun updateFullImageView() {
    // Text label
    val label = if (currentImageIndex == 0) "Front Cover" else "Picture $currentImageIndex"
    fullImageLabelTv.text = label

    // Image path
    val path = viewModel.outputFilePath(currentImageIndex)
    fullImage.setImageBitmap(bitmapFromFile(path))
  }
}
