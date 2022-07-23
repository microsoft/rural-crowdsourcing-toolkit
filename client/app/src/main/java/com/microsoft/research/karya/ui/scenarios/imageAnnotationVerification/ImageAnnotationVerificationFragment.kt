package com.microsoft.research.karya.ui.scenarios.imageAnnotationVerification

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.PointF
import android.graphics.RectF
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.jsibbold.zoomage.dataClass.Polygon
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.*
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.backBtn
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.instructionTv
import java.util.*
import kotlin.collections.HashMap


private val colors = listOf(
  Color.parseColor("#4DD0E1"),
  Color.parseColor("#EEFF41"),
  Color.parseColor("#7E57C2"),
  Color.parseColor("#F44336")
)

@AndroidEntryPoint
class ImageAnnotationVerificationFragment : BaseMTRendererFragment(R.layout.microtask_image_annotation_verification_fragment) {
  override val viewModel: ImageAnnotationVerificationViewModel by viewModels()
  private val args: ImageAnnotationVerificationFragmentArgs by navArgs()
  private var rectangleCropCoors: HashMap<String, RectF>? = null
  private var polygonCropCoors: HashMap<String, Polygon>? = null

  // Array of Pair to hold label names and corresponding colors
  lateinit var labelDetailArray: Array<Pair<String, Int>>
  lateinit var labels: List<String>

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
    backBtn.setOnClickListener { /* TODO: Hit back button click listener */ }

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

    if (viewModel.validationScore.value == R.string.rating_undefined) {
      Toast.makeText(requireContext(), getString(R.string.no_image_validation_score_selected), Toast.LENGTH_LONG)
    }
    viewModel.handleNextCLick()
  }


  private fun setupObservers() {
    viewModel.imageFilePath.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { path ->
      if (path.isNotEmpty()) {
        val image: Bitmap = BitmapFactory.decodeFile(path)
        sourceImageIv.setImageBitmap(image)
      }
      //TODO: Put an else condition to put a placeholder image

      // Clear the existing boxes
      val ids = sourceImageIv.allCropRectangleIds + sourceImageIv.allCropPolygonIds
      for (id in ids) {
        sourceImageIv.removeCropObject(id)
      }
    }

    viewModel.polygonCoors.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { coorsArrayList ->
      val polygon = Polygon(coorsArrayList.toArray() as Array<out PointF>?)
      sourceImageIv.addCropPolygon(System.currentTimeMillis().toString(), Color.parseColor("#000000"), polygon)
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
