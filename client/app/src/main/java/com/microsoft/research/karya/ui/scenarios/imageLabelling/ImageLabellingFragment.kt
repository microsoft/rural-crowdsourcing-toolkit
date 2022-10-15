package com.microsoft.research.karya.ui.scenarios.imageLabelling

import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.viewModels
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.navigation.fragment.findNavController
import androidx.navigation.fragment.navArgs
import androidx.navigation.navGraphViewModels
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.item_float_label.view.*
import kotlinx.android.synthetic.main.microtask_image_labelling.*
import kotlinx.android.synthetic.main.microtask_image_labelling.instructionTv
import java.io.File
import java.util.jar.Manifest

@AndroidEntryPoint
class ImageLabellingFragment : BaseMTRendererFragment(R.layout.microtask_image_labelling) {
  override val viewModel: ImageLabellingViewModel by hiltNavGraphViewModels(R.id.imageLabellingFlow)
  private val args: ImageLabellingFragmentArgs by navArgs()

  // TODO: Convert this to enum
  private lateinit var imageSource: String
  private val labelMap: MutableMap<String, View> = mutableMapOf()

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

    // Set microtask instruction
    val instruction = try {
      viewModel.task.params.asJsonObject.get("instruction").asString
    } catch (e: Exception) {
      getString(R.string.image_labelling_instruction)
    }

    imageSource = try {
      viewModel.task.params.asJsonObject.get("imageByUsers").asString
    } catch (e: Exception) {
      "server"
    }

    setupObservers()

    instructionTv.text = instruction

    // Setup request permission launcher for camera access
    val requestPermissionLauncher =
      registerForActivityResult(
        ActivityResultContracts.RequestPermission()
      ) { isGranted: Boolean ->
        if (isGranted) {
          navigateToCameraFragment()
        }
      }

    // Set the takePicture button on click listener
    takePictureBtn.setOnClickListener {
      // Check permission for camera
      if (ActivityCompat.checkSelfPermission(requireContext(), android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        // Permission not granted yet, ask for permission
        requestPermissionLauncher.launch(android.Manifest.permission.CAMERA)
      } else {
        navigateToCameraFragment()
      }
    }

    // Set next button click handler
    nextBtn.setOnClickListener { handleNextClick() }

    // Set up label views
    val labels = try {
      viewModel.task.params.asJsonObject.get("labels").asJsonArray.map { it.asString }
    } catch (e: Exception) {
      arrayListOf()
    }

    labels.forEach {
      val label = it
      val labelView = layoutInflater.inflate(R.layout.item_float_label, null)
      labelView.label.text = label

      labelView.setOnClickListener {
        viewModel.flipState(label)
      }
      labelsLayout.addView(labelView)

      labelMap[label] = labelView
    }
  }

  /**
   * Navigate to camera fragment
   */
  private fun navigateToCameraFragment() {
    findNavController().navigate(R.id.action_imageLabellingFragment_to_imageLabellingCameraFragment)
  }

  /**
   * Renders layout based on whether the image is available or not
   * @param imageAvailable: Boolean specifying whether the image is available to load
   */
  private fun renderLayout(imageAvailable: Boolean) {
    if (imageAvailable) {
      labelsLayout.visible()
      nextBtn.visible()
      pictureInputLayout.invisible()
      // TODO: Load the image here
    } else {
      labelsLayout.invisible()
      nextBtn.invisible()
      pictureInputLayout.visible()
    }
  }

  private fun handleNextClick() {
    viewModel.completeLabelling()
  }

  private fun setupObservers() {
    // Set observers for the case where image source is server
    if (imageSource != "user") {
      viewModel.imageFilePath.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { path ->
        if (path.isNotEmpty()) {
          val image: Bitmap = BitmapFactory.decodeFile(path)
          sourceImageIv.setImageBitmap(image)
          renderLayout(true)
        } else {
          sourceImageIv.setImageDrawable(null)
        }
      }
    }
    // Set observers for the case where image source is user
    else {
      viewModel.captureResult.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { pictureResult ->

        if (pictureResult != null) {
          pictureResult.toFile(File(viewModel.outputFilePath())) { file ->
            // TODO: Show a progress bar while the image saves
            if (file != null) {
              renderLayout(true)
              // Set the picture in zoomage view
              pictureResult.toBitmap { bitMap ->
                sourceImageIv.setImageBitmap(bitMap)
              }
            }
          }
        } else {
          sourceImageIv.setImageResource(R.color.gray)
          renderLayout(false)
        }
      }
    }

    viewModel.labelState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { labelState ->
      Log.d("debug-label-state", labelState.toString())
      labelMap.forEach { (s, view) ->
        val state = labelState[s] ?: false
        val color = if (state) R.color.c_light_green else R.color.c_light_grey
        view.label_card.background.setTint(ContextCompat.getColor(requireContext(), color))
      }
    }
  }
}
