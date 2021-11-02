package com.microsoft.research.karya.ui.scenarios.quiz

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.google.android.material.button.MaterialButton
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_quiz.*

@AndroidEntryPoint
class QuizMainFragment: BaseMTRendererFragment(R.layout.microtask_quiz) {
  override val viewModel: QuizViewModel by viewModels()
  val args: QuizMainFragmentArgs by navArgs()

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    viewModel.setupViewModel(args.taskId, args.completed, args.total)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    // Get and set microtask instruction
    // If no instruction gone
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
    // Question has changed. Update the UI accordingly.
    viewModel.question.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { question ->
      questionTv.text = question.question

      when (question.type) {
        QuestionType.invalid -> {
          textResponseEt.invisible()
          mcqResponseGroup.invisible()
        }

        QuestionType.text -> {
          mcqResponseGroup.invisible()
          textResponseEt.visible()
          textResponseEt.minLines = if (question.long == true) 3 else 1
        }

        QuestionType.mcq -> {
          textResponseEt.invisible()
          mcqResponseGroup.visible()

          mcqResponseGroup.removeAllViews()
          viewModel.clearButtonTextMap()

          question.options?.forEach { option ->
            val button = MaterialButton(requireContext())
            button.text = option
            mcqResponseGroup.addView(button)
            viewModel.addButtonTextMap(button.id, option)
          }

          mcqResponseGroup.isSingleSelection = question.multiple == false
        }
      }
    }
  }

  private fun setupListeners() {
    nextBtn.setOnClickListener { viewModel.submitResponse() }

    textResponseEt.doAfterTextChanged {
      viewModel.updateTextResponse(textResponseEt.text.toString())
    }

    mcqResponseGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
      if (isChecked) viewModel.updateMCQResponse(checkedId)
    }
  }
}
