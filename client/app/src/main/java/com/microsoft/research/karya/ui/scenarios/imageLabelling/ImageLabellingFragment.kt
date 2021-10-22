package com.microsoft.research.karya.ui.scenarios.imageLabelling

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.item_float_label.view.*
import kotlinx.android.synthetic.main.microtask_image_labelling.*

@AndroidEntryPoint
class ImageLabellingFragment : BaseMTRendererFragment(R.layout.microtask_image_labelling) {
  override val viewModel: ImageLabellingViewModel by viewModels()
  private val args: ImageLabellingFragmentArgs by navArgs()

  private val labelMap: MutableMap<String, View> = mutableMapOf()

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    viewModel.setupViewModel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupObservers()

    // Set microtask instruction
    val instruction = try {
      viewModel.task.params.asJsonObject.get("instruction").asString
    } catch (e: Exception) {
      getString(R.string.image_labelling_instruction)
    }
    instructionTv.text = instruction

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

  private fun handleNextClick() {
    viewModel.completeLabelling()
  }

  private fun setupObservers() {
    viewModel.imageFilePath.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { path ->
      if (path.isNotEmpty()) {
        val image: Bitmap = BitmapFactory.decodeFile(path)
        sourceImageIv.setImageBitmap(image)
      } else {
        sourceImageIv.setImageDrawable(null)
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
