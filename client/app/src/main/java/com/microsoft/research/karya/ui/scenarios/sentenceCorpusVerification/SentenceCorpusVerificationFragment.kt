package com.microsoft.research.karya.ui.scenarios.sentenceCorpusVerification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.transliteration.validator.Validator
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.instructionTv
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.nextBtn
import kotlinx.android.synthetic.main.microtask_sentence_corpus_verification.*

@AndroidEntryPoint
class SentenceCorpusVerificationFragment :
  BaseMTRendererFragment(R.layout.microtask_sentence_corpus_verification) {
  override val viewModel: SentenceCorpusVerificationViewModel by viewModels()
  val args: SentenceCorpusVerificationFragmentArgs by navArgs()

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

    nextBtn.setOnClickListener { onNextClick() }

    Validator.init()
  }

  private fun onNextClick() {
    for (entry in viewModel.sentences.value) {
      if (entry.value == "UNKNOWN") {
        Toast.makeText(requireContext(), "Please verify all sentences", Toast.LENGTH_LONG).show()
        return
      }
    }
    viewModel.handleNextClick()
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
      val onRemoveItemClickListener = object : OnScoreToggleGroupButtonListener {
        override fun onClick(sentence: String, buttonId: Int) {
          var status: String? = null
          when(buttonId) {
            R.id.scoreValidBtn -> status = "VALID"
            R.id.scoreInvalidBtn -> status = "INVALID"
            R.id.scoreErrorBtn -> status = "ERROR"
          }
          viewModel.sentences.value[sentence] = status!!
        }
      }

      val sentenceArrayList = ArrayList<String>()
      for (entry in sentences) {
        sentenceArrayList.add(entry.key)
      }

      val adapter = SentenceAdapter(sentenceArrayList, onRemoveItemClickListener)
      sentenceVerificationRv.layoutManager = LinearLayoutManager(requireActivity())
      sentenceVerificationRv.adapter = adapter
      }
    }

  }



