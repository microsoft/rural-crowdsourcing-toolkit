package com.microsoft.research.karya.ui.scenarios.textCollection

import android.os.Bundle
import android.text.InputFilter
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.transliteration.validator.Validator
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.item_float_word.view.*
import kotlinx.android.synthetic.main.microtask_text_collection.*
import kotlinx.android.synthetic.main.microtask_transliteration.addBtn
import kotlinx.android.synthetic.main.microtask_transliteration.errorTv
import kotlinx.android.synthetic.main.microtask_transliteration.instructionTv
import kotlinx.android.synthetic.main.microtask_transliteration.nextBtn
import kotlinx.android.synthetic.main.microtask_transliteration.userVariantLayout
import kotlinx.android.synthetic.main.microtask_transliteration.wordTv

@AndroidEntryPoint
class TextCollectionFragment : BaseMTRendererFragment(R.layout.microtask_text_collection) {
  override val viewModel: TextCollectionViewModel by viewModels()
  val args: TextCollectionFragmentArgs by navArgs()
  lateinit var adapter: SentenceAdapter

  override fun requiredPermissions(): Array<String> {
    return emptyArray()
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewModel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    textCollectionEt.inputType =
      InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS

    // Only allow alphabets
    textCollectionEt.filters = arrayOf(
      InputFilter { source, start, end, dest, dstart, dend ->
        return@InputFilter source.replace(Regex("[^a-z]*"), "")
      }
    )

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString ?: ""
    instructionTv.text = recordInstruction

    adapter = SentenceAdapter(viewModel.inputVariants.value!!)
    sentenceRecyclerView.adapter = adapter

    addBtn.setOnClickListener { addWord() }

    textCollectionEt.onSubmit { addWord() }

    nextBtn.setOnClickListener { onNextClick() }

    Validator.init()
  }

  private fun addWord() {

    errorTv.gone() // Remove any existing errors

    val word = textCollectionEt.text.toString()
    val outputVariants = viewModel.outputVariants.value!!
    val inputVariants = viewModel.inputVariants.value!!

    if (word.isEmpty()) {
      showError("Please enter a sentence")
      return
    }

    for (item in outputVariants) {
      if (item.first == word) {
        showError("The sentence is already present")
      }
    }

    if (inputVariants.count() { pair ->
        pair.second == TextCollectionViewModel.SentenceVerificationStatus.NEW
      } == viewModel.limit) {
      showError("Only upto ${viewModel.limit} sentences are allowed.")
      return
    }

    viewModel.addWord(word)
  }

  private fun showError(error: String) {
    errorTv.text = error
    errorTv.visible()
  }

  private fun onNextClick() {
    if (viewModel.inputVariants.value!!.size == 0) {
      showError("Please enter atleast one sentence")
      return
    }
    errorTv.gone()
    userVariantLayout.removeAllViews()
    viewModel.handleNextClick()
  }

  private fun setupObservers() {
    viewModel.wordTvText.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { text -> wordTv.text = text }

    viewModel.outputVariants.observe(viewLifecycleOwner) {
        sentences -> adapter.notifyDataSetChanged()
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
