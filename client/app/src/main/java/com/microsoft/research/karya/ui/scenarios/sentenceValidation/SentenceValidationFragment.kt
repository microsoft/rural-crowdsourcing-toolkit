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

  private var grammarValid: Boolean? = null
  private var spellingValid: Boolean? = null

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
    grammarGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
      if (isChecked) {
        grammarValid = when (checkedId) {
          grammarGoodBtn.id -> true
          grammarBadBtn.id -> false
          else -> false
        }
        updateNextButtonStatus()
      }
    }

    spellingGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
      if (isChecked) {
        spellingValid = when (checkedId) {
          spellingGoodBtn.id -> true
          spellingBadBtn.id -> false
          else -> false
        }
        updateNextButtonStatus()
      }
    }

    nextBtn.setOnClickListener {
      viewModel.submitResponse(grammarValid!!, spellingValid!!)
      grammarGroup.clearChecked()
      spellingGroup.clearChecked()
      grammarValid = null
      spellingValid = null
    }
  }

  private fun updateNextButtonStatus() {
    if (grammarValid != null && spellingValid != null) {
      enableNextBtn()
    } else {
      disableNextBtn()
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