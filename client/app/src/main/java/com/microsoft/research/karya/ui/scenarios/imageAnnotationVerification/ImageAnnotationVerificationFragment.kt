package com.microsoft.research.karya.ui.scenarios.imageAnnotationVerification

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.RectF
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.Toast
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.jsibbold.zoomage.dataClass.Polygon
import com.jsibbold.zoomage.enums.CropObjectStatus
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.*


@AndroidEntryPoint
class ImageAnnotationVerificationFragment : BaseMTRendererFragment(R.layout.microtask_image_annotation_verification_fragment) {
  override val viewModel: ImageAnnotationVerificationViewModel by viewModels()
  private val args: ImageAnnotationVerificationFragmentArgs by navArgs()
  private var rectangleCropCoors: HashMap<String, RectF>? = null
  private var polygonCropCoors: HashMap<String, Polygon>? = null

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

    // Set microtask instruction
    val instruction = try {
      viewModel.task.params.asJsonObject.get("instruction").asString
    } catch (e: Exception) {
      getString(R.string.image_annotation_instruction)
    }
    instructionTv.text = instruction

    // Set next button click handler
    nextBtn.setOnClickListener { handleNextClick() }

    // Set back button click handler
    backBtn.setOnClickListener { viewModel.handleBackClick() }

    // Set listeners for btn group
    scoreToggleGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
      if (isChecked) {
        when (checkedId) {
          scoreBadBtn.id -> viewModel.handleScoreChange(R.string.img_annotation_verification_bad)
          scoreOKBtn.id -> viewModel.handleScoreChange(R.string.img_annotation_verification_ok)
          scoreGoodBtn.id -> viewModel.handleScoreChange(R.string.img_annotation_verification_good)
        }
      }
    }
  }

  override fun onPause() {
    super.onPause()
    rectangleCropCoors = sourceImageIv.coordinatesForRectCropBoxes
    polygonCropCoors = sourceImageIv.coordinatesForPolygonCropBoxes
  }

  private fun handleNextClick() {
    if (getString(viewModel.validationScore.value) == getString(R.string.rating_undefined)) {
      Toast.makeText(requireContext(), getString(R.string.no_image_validation_score_selected), Toast.LENGTH_LONG).show()
      return
    }
    viewModel.handleNextCLick()
  }


  private fun setupObservers() {
    viewModel.imageFilePath.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { path ->
      if (path.isNotEmpty()) {
        val image: Bitmap = BitmapFactory.decodeFile(path)
        sourceImageIv.setImageBitmap(image)
      } else {
        return@observe
      }
      //TODO: Put an else condition to put a placeholder image

      // Clear the existing boxes
      val ids = sourceImageIv.allCropRectangleIds + sourceImageIv.allCropPolygonIds
      for (id in ids) {
        sourceImageIv.removeCropObject(id)
      }
      // Clear the checks on group toggle button
      scoreToggleGroup.clearChecked()

      // Set listener to add crop object after the image is loaded
      sourceImageIv.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          return try {
            viewModel.setCoordinatesForBox()
            // Note that returning "true" is important or else the drawing pass will be canceled
            true
          } finally {
            // Remove listener as further notifications are not needed
            sourceImageIv.viewTreeObserver.removeOnPreDrawListener(this)
          }
        }
      })

    }

    viewModel.polygonCoors.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { coors ->
      // Return is coordinates are empty
      if (coors.isEmpty()) {
        return@observe
      }
      val polygon = Polygon(coors)
      val id = System.currentTimeMillis().toString()
      sourceImageIv.addCropPolygon(id, Color.parseColor("#FF0000"), polygon, CropObjectStatus.INACTIVE)
      if (!sourceImageIv.lockOrUnlockCropObject(id)) {
        sourceImageIv.lockOrUnlockCropObject(id)
      }
    }

    viewModel.validationScore.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { id ->
      when(id) {
        R.string.img_annotation_verification_bad -> scoreToggleGroup.check(R.id.scoreBadBtn)
        R.string.img_annotation_verification_ok -> scoreToggleGroup.check(R.id.scoreOKBtn)
        R.string.img_annotation_verification_good -> scoreToggleGroup.check(R.id.scoreGoodBtn)
      }
    }

  }
}
