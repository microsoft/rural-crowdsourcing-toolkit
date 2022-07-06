package com.microsoft.research.karya.ui.scenarios.imageAnnotation

import android.app.AlertDialog
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.RectF
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_image_annotation.*
import java.util.*
import kotlin.collections.HashMap


private val colors = listOf(
  Color.parseColor("#4DD0E1"),
  Color.parseColor("#EEFF41"),
  Color.parseColor("#7E57C2"),
  Color.parseColor("#F44336")
)

@AndroidEntryPoint
class ImageAnnotationFragment : BaseMTRendererFragment(R.layout.microtask_image_annotation) {
  override val viewModel: ImageAnnotationViewModel by viewModels()
  private val args: ImageAnnotationFragmentArgs by navArgs()
  private var cropCoors: HashMap<String, RectF>? = null

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

    // Get labels
    labels = try {
      viewModel.task.params.asJsonObject.get("labels").asJsonArray.map { it.asString }
    } catch (e: Exception) {
      arrayListOf()
    }
    // Create label detail array
    labelDetailArray = Array(labels.size) { idx ->
      Pair(labels[idx], colors[idx]);
    }

    editRectColorBtn.setOnClickListener {
      // If no rectangle in focus, return
      if ((sourceImageIv.focusedCropRectangleId).isNullOrEmpty()) {
        return@setOnClickListener
      }
      var alertDialog: AlertDialog? = null
      val onLabelItemClickListener = object : OnLabelItemClickListener {
        override fun onClick(labelView: View, position: Int) {

          sourceImageIv.setCropRectColor(
            sourceImageIv.focusedCropRectangleId,
            (colors[position])
          )
          alertDialog!!.dismiss()
        }
      }
      alertDialog = buildLabelListDialogBox(
        getString(R.string.select_image_annotation_label_dialog_instruction),
        onLabelItemClickListener
      )
      alertDialog!!.show()
    }

    // Set listeners to add box
    addBoxButton.setOnClickListener {
      var alertDialog: AlertDialog? = null
      val onLabelItemClickListener = object : OnLabelItemClickListener {
        override fun onClick(labelView: View, position: Int) {
          // attach random UUID with the selected box type
          val key = labels[position] + "_" + UUID.randomUUID().toString();
          sourceImageIv.addCropRectangle(key, colors[position])
          alertDialog!!.dismiss()
        }
      }
      alertDialog = buildLabelListDialogBox(
        getString(R.string.select_image_annotation_label_dialog_instruction),
        onLabelItemClickListener
      )
      alertDialog!!.show()

//      val selectedId = boxSpinner.selectedItemId
//      // attach random UUID with the selected box type
//      val key = labels[selectedId.toInt()] + "_" + UUID.randomUUID().toString();
//      sourceImageIv.addCropRectangle(key, (colors[boxSpinner.selectedItemPosition]))
    }
    // Set Listeners to remove box
    removeBoxButton.setOnClickListener { sourceImageIv.removeCropRectangle(sourceImageIv.focusedCropRectangleId) }

    // Set Listener to lock a crop box
    lockCropRectBtn.setOnClickListener {
      // If no rectangle in focus, return
      if ((sourceImageIv.focusedCropRectangleId).isNullOrEmpty()) {
        return@setOnClickListener
      }
      val isLocked = sourceImageIv.lockOrUnlockCropRectangle(sourceImageIv.focusedCropRectangleId)
      // Change the image wrt the state of lock
      if (isLocked) lockCropRectBtn.setImageResource(R.drawable.ic_outline_lock_24);
      else lockCropRectBtn.setImageResource(R.drawable.ic_baseline_lock_open_24);
    }

    sourceImageIv.setOnCropRectangleClickListener { rectFData ->
      if (rectFData.locked) lockCropRectBtn.setImageResource(R.drawable.ic_outline_lock_24);
      else lockCropRectBtn.setImageResource(R.drawable.ic_baseline_lock_open_24);
      spinner_item_color.setCardBackgroundColor(rectFData.color)
      labelTv.text = labels[colors.indexOf(rectFData.color)]
    }
  }

  override fun onPause() {
    super.onPause()
    cropCoors = sourceImageIv.coordinatesForCropBoxes
  }

  override fun onResume() {
    super.onResume()
    if (sourceImageIv.coordinatesForCropBoxes.isEmpty() && cropCoors != null) {
      for (id in cropCoors!!.keys) {
        val label = id.split("_")[0]
        val position = labels.indexOf(label)
        sourceImageIv.addCropRectangle(id, colors[position], cropCoors!![id])
      }
    }
  }

  private fun handleNextClick() {

    val cropCoors = sourceImageIv.coordinatesForCropBoxes
    if (cropCoors.isEmpty()) {
      // Display an alert box warning the user of no annotation boxes
      showNoBoxAlertBox()
      return
    }
    viewModel.setBoxCoors(cropCoors)
    viewModel.handleNextCLick()
  }

  private fun showNoBoxAlertBox() {

    val alertDialog: AlertDialog? = activity?.let {
      val builder = AlertDialog.Builder(it)
      builder.apply {
        setPositiveButton(
          getString(R.string.proceed_text)
        ) { _, _ ->
          viewModel.handleNextCLick()
        }
        setNegativeButton(
          getString(R.string.cancel_text)
        ) { _, _ ->
          // User cancelled the dialog
        }
      }

      builder.setMessage(getString(R.string.no_annotation_box_annotation_message_text))
        .setTitle(getString(R.string.no_annotation_box_dialog_title_text))
      // Create the AlertDialog
      builder.create()
    }
    alertDialog!!.show()
  }

  private fun setupObservers() {
    viewModel.imageFilePath.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { path ->
      if (path.isNotEmpty()) {
        val image: Bitmap = BitmapFactory.decodeFile(path)
        sourceImageIv.setImageBitmap(image)
      }
      //TODO: Put an else condition to put a placeholder image

      // Clear the existing boxes
      val ids = sourceImageIv.allCropRectangleIds
      for (id in ids) {
        sourceImageIv.removeCropRectangle(id)
      }
    }
  }

  private fun buildLabelListDialogBox(title: String, onLabelItemClickListener: OnLabelItemClickListener): AlertDialog? {

    var alertDialog: AlertDialog? = null
    alertDialog = activity?.let { fragmentActivity ->
      val builder = AlertDialog.Builder(fragmentActivity)
      // Get the layout inflater
      val inflater = requireActivity().layoutInflater;
      // Inflate and set the layout for the dialog
      // Pass null as the parent view because its going in the dialog layout
      val view = inflater.inflate(R.layout.image_annotation_label_list_dialog_layout, null)
      builder.setView(view)

      val adapter = LabelAdapter(labelDetailArray, onLabelItemClickListener)
      val recyclerView = view.findViewById<RecyclerView>(R.id.image_annotation_label_list_rv)
      recyclerView.layoutManager = LinearLayoutManager(fragmentActivity)
      recyclerView.adapter = adapter

      builder.setTitle(title)
      // Create the AlertDialog
      builder.create()
    }

    return alertDialog
  }

}
