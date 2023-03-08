package com.microsoft.research.karya.ui.scenarios.quiz

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.TypedValue
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_quiz.*
import nl.bryanderidder.themedtogglebuttongroup.ThemedButton
import com.intuit.ssp.R as ssp

@AndroidEntryPoint
class QuizMainFragment : BaseMTRendererFragment(R.layout.microtask_quiz) {
  override val viewModel: QuizViewModel by viewModels()
  private val args: QuizMainFragmentArgs by navArgs()

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
      if (!question.questionImage.isNullOrEmpty()) {
        val questionImage = BitmapFactory.decodeFile(question.questionImage)
        questionIv.setImageBitmap(questionImage)
        questionIv.visible()
      } else {
        questionIv.gone()
      }

      when (question.questionType) {
        QuestionType.invalid -> {
          textResponseEt.invisible()
          mcqResponseGroup.invisible()
          imageResponseRv.invisible()
        }

        QuestionType.text -> {
          textResponseEt.visible()
          mcqResponseGroup.gone()
          imageResponseRv.gone()
          textResponseEt.minLines = if (question.long == true) 3 else 1
        }

        QuestionType.mcq -> {
          when (question.optionType) {
            OptionType.text -> {
              mcqResponseGroup.visible()
              textResponseEt.gone()
              imageResponseRv.gone()
              textResponseEt.minLines = 2

              mcqResponseGroup.removeAllViews()

              question.options?.forEach { option ->
                val button = ThemedButton(requireContext())
                button.text = option
                button.tvText.setTextSize(TypedValue.COMPLEX_UNIT_PX, resources.getDimension(ssp.dimen._20ssp))
                button.tvSelectedText.setTextSize(TypedValue.COMPLEX_UNIT_PX, resources.getDimension(ssp.dimen._20ssp))
                button.selectedBgColor = R.color.c_dark_green
                mcqResponseGroup.addView(
                  button,
                  ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                )
              }

              mcqResponseGroup.selectableAmount = if (question.multiple == false) 1 else question.options!!.size
            }
            OptionType.image -> {
              imageResponseRv.visible()
              mcqResponseGroup.gone()
              textResponseEt.gone()

              val adapter = OptionImageAdapter(question.options!!, object: OnImageOptionCheckboxClickListener {
                override fun onClick(imageName: String) {
                  viewModel.updateMCQResponse(imageName)
                }
              })
              imageResponseRv.layoutManager = LinearLayoutManager(requireContext())
              imageResponseRv.adapter = adapter
            }
          }
        }
      }
    }
  }

  private fun setupListeners() {
    nextBtn.setOnClickListener {
      viewModel.submitResponse()
      textResponseEt.setText("")
    }

    textResponseEt.doAfterTextChanged {
      viewModel.updateTextResponse(textResponseEt.text.toString())
    }

    mcqResponseGroup.setOnSelectListener { button ->
      viewModel.updateMCQResponse(button.text)
    }
  }
}
