package com.microsoft.research.karya.ui.scenarios.sentenceValidation

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*
import kotlinx.android.synthetic.main.microtask_sentence_validation.*

@AndroidEntryPoint
class SentenceValidationFragment : BaseMTRendererFragment(R.layout.microtask_sentence_validation) {
  override val viewModel: SentenceValidationViewModel by viewModels()
  private val args: SentenceValidationFragmentArgs by navArgs()

  private var valid: Boolean? = null

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

    // Get and set instruction
    try {
      val instruction = viewModel.task.params.asJsonObject.get("instruction").asString
      instructionTv.text = instruction
    } catch (e: Exception) {
      instructionTv.gone()
    }

    // Setup observers
    setupObservers()

    // Setup listeners
    setupListeners()
  }

  private fun setupObservers() {
    // Sentence observer
    viewModel.sentence.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { sentence ->
      sentenceTv.text = sentence
      disableNextBtn()
    }
  }

  private fun setupListeners() {
    validationButtonGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
      if (isChecked) {
        valid = when (checkedId) {
          yesBtn.id -> true
          noBtn.id -> false
          else -> false
        }
        enableNextBtn()
      }
    }

    nextBtn.setOnClickListener {
      viewModel.submitResponse(valid!!)
      validationButtonGroup.clearChecked()
      valid = null
    }
  }

  private fun enableNextBtn() {
    nextBtn.isClickable = true
    nextBtn.enable()
    nextBtn.nextIv.setBackgroundResource(R.drawable.ic_next_enabled)
  }

  private fun disableNextBtn() {
    nextBtn.isClickable = false
    nextBtn.disable()
    nextBtn.nextIv.setBackgroundResource(R.drawable.ic_next_disabled)
  }
}