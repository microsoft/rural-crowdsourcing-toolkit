package com.microsoft.research.karya.ui.scenarios.textTranslationValidation

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.SeekBar
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_text_translation_validation.*

@AndroidEntryPoint
class TextTranslationValidationMainFragment : BaseMTRendererFragment(R.layout.microtask_text_translation_validation) {
  override val viewModel: TextTranslationValidationViewModel by viewModels()
  val args: TextTranslationValidationMainFragmentArgs by navArgs()

  private var isScoreSet = false

  override fun requiredPermissions(): Array<String> {
    return emptyArray()
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewModel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    /** record instruction */
    val validationInstruction = viewModel.task.params.asJsonObject.get("instruction").asString ?: ""
    instructionTv.text = validationInstruction

    nextBtn.setOnClickListener { onNextClick() }

    scoreSeekbar.setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
      override fun onProgressChanged(p0: SeekBar?, p1: Int, p2: Boolean) {
        scoreTv.text = p1.toString()
        viewModel.setScore(p1)
        isScoreSet = true
      }

      override fun onStartTrackingTouch(p0: SeekBar?) {
      }

      override fun onStopTrackingTouch(p0: SeekBar?) {
      }
    })
  }

  private fun showError(error: String) {
//    errorTv.text = error
//    errorTv.visible()
  }

  private fun onNextClick() {
    if (!isScoreSet) {
      showError(getString(R.string.text_translation_no_score_provided_text))
      return
    }
//    errorTv.gone()
    //TODO: Reset Progress Bar
    viewModel.handleNextClick()
    resetUI()
  }

  private fun setupObservers() {
    viewModel.sourceTvText.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text -> sourceTextTv.text = text }
    viewModel.targetTvText.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text -> targetTextTv.text = text }
  }

  private fun resetUI() {
    scoreSeekbar.progress = 0
    scoreTv.text = "0"
    isScoreSet = false
  }

}
