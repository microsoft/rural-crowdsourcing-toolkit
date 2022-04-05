package com.microsoft.research.karya.ui.scenarios.imageAnnotation

import android.app.AlertDialog
import android.content.DialogInterface
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_image_annotation.*
import java.util.*

import android.graphics.drawable.ColorDrawable




private val colors = listOf("#4DD0E1", "#EEFF41", "#7E57C2", "#F44336")

@AndroidEntryPoint
class ImageAnnotationFragment : BaseMTRendererFragment(R.layout.microtask_image_annotation) {
  override val viewModel: ImageAnnotationViewModel by viewModels()
  private val args: ImageAnnotationFragmentArgs by navArgs()

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
    val labels = try {
      viewModel.task.params.asJsonObject.get("labels").asJsonArray.map { it.asString }
    } catch (e: Exception) {
      arrayListOf()
    }

    val spinnerArrayAdapter: ArrayAdapter<String> = ArrayAdapter<String>(
      requireContext(), android.R.layout.simple_spinner_item,
      labels
    ) //selected item will look like a spinner set from XML
    spinnerArrayAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
    boxSpinner.adapter = spinnerArrayAdapter

    // Set the color when a label is chosen
    boxSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
      override fun onItemSelected(parent: AdapterView<*>, view: View, position: Int, id: Long) {
//        spinner_item_color.setBackgroundColor(colors[position])
        spinner_item_color.setCardBackgroundColor(Color.parseColor(colors[position]))
      } // to close the onItemSelected

      override fun onNothingSelected(parent: AdapterView<*>) {

      }
    }

    // Set listeners to add box
    addBoxButton.setOnClickListener {
      val selectedId = boxSpinner.selectedItemId
      // attach random UUID with the selected box type
      val key = labels[selectedId.toInt()] + "_" + UUID.randomUUID().toString();
      sourceImageIv.addCropRectangle(key, Color.parseColor(colors[boxSpinner.selectedItemPosition]))
    }
    // Set Listeners to remove box
    removeBoxButton.setOnClickListener { sourceImageIv.removeCropRectangle() }
  }

  private fun handleNextClick() {

    val cropCoors = sourceImageIv.getCropCoors()
    if (cropCoors.isEmpty()) {
      // Display an alert box warning the user of no annotation boxes
      showNoBoxAlertBox()
      return
    }
    viewModel.setBoxCoors(sourceImageIv.getCropCoors())
    viewModel.handleNextCLick()
  }

  private fun showNoBoxAlertBox() {

    val alertDialog: AlertDialog? = activity?.let {
      val builder = AlertDialog.Builder(it)
      builder.apply {
        setPositiveButton(getString(R.string.proceed_text),
          DialogInterface.OnClickListener { dialog, id ->
            viewModel.handleNextCLick()
          })
        setNegativeButton(getString(R.string.cancel_text),
          DialogInterface.OnClickListener { dialog, id ->
            // User cancelled the dialog
          })
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
      sourceImageIv.removeAllRectangles()
    }
  }
}
