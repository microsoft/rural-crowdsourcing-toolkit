package com.microsoft.research.karya.ui.scenarios.sentenceCorpus

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.transliteration.validator.Validator
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_sentence_corpus.*
import kotlinx.android.synthetic.main.microtask_sentence_corpus.instructionTv
import kotlinx.android.synthetic.main.microtask_sentence_corpus.nextBtn

@AndroidEntryPoint
class SentenceCorpusFragment :
  BaseMTRendererFragment(R.layout.microtask_sentence_corpus) {
  override val viewModel: SentenceCorpusViewModel by viewModels()
  val args: SentenceCorpusFragmentArgs by navArgs()

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewModel(args.taskId, args.completed, args.total)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    /** instruction */
    val instruction =
      viewModel.task.params.asJsonObject.get("instruction").asString ?: ""
    instructionTv.text = instruction

    addBtn.setOnClickListener { addSentence() }

    sentenceEt.onSubmit { addSentence() }

    nextBtn.setOnClickListener { onNextClick() }

    backBtn.setOnClickListener { viewModel.handleBackClick() }

    Validator.init()
  }

  private fun addSentence() {

    errorTv.gone() // Remove any existing errors

    val sentence = sentenceEt.text.toString()
    val sentences = viewModel.sentences.value

    if (sentence.isEmpty()) {
      showError("Please enter a sentence")
      return
    }

    if (sentences.contains(sentence)) {
      showError("The sentence is already present")
      return
    }

    if (sentences.size == viewModel.limit) {
      showError("You reached your sentence limit: " + viewModel.limit)
      return
    }

    viewModel.addSentence(sentence)
    sentenceEt.text.clear()
  }

  private fun showError(error: String) {
    errorTv.text = error
    errorTv.visible()
  }

  private fun onNextClick() {
    val sentences = viewModel.sentences.value
    if (sentences.size == 0) {
      skipTask(true, "", getString(R.string.skip_task_warning))
      return
    }
    errorTv.gone()
    viewModel.handleNextClick()
    sentenceEt.text.clear()
  }

  private fun setupObservers() {
    viewModel.contextText.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) {
        text -> contextTv.text = text

    }

    viewModel.sentences.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { sentences ->
      val onRemoveItemClickListener = object : OnRemoveItemClickListener {
        override fun onClick(labelView: View, position: Int) {
          viewModel.removeSentenceAt(position)
        }
      }
      val adapter = SentenceAdapter(sentences, onRemoveItemClickListener)
      sentenceRv.layoutManager = LinearLayoutManager(requireActivity())
      sentenceRv.adapter = adapter
      }
    }

  fun EditText.onSubmit(func: () -> Unit) {
    setOnEditorActionListener { _, actionId, _ ->

      if (actionId == EditorInfo.IME_ACTION_DONE ||
        actionId == EditorInfo.IME_ACTION_NEXT ||
        actionId == EditorInfo.IME_ACTION_GO
      ) {
        func()
      }
      true
    }
  }

  }



