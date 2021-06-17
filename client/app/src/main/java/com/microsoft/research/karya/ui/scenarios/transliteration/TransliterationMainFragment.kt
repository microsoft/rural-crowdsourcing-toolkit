package com.microsoft.research.karya.ui.scenarios.speechData

import android.os.Bundle
import android.text.InputType
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.Toast
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.item_float_word.view.*
import kotlinx.android.synthetic.main.transliteration_main_fragment.*

@AndroidEntryPoint
class TransliterationMainFragment : BaseMTRendererFragment(R.layout.transliteration_main_fragment) {
  override val viewModel: TransliterationMainViewModel by viewModels()
  val args: SpeechDataMainFragmentArgs by navArgs()

  override fun requiredPermissions(): Array<String> {
    return emptyArray()
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewmodel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    textTransliteration.setInputType(InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS)

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString ?: ""
    wordTv.text = recordInstruction

    addBtn.setOnClickListener { addWord() }

    textTransliteration.onSubmit { addWord() }

    nextBtn.setOnClickListener { viewModel.handleNextClick() }
  }

  private fun addWord() {
    val word = textTransliteration.text.toString()
    if (word.contains(" ")) {
      Toast.makeText(requireContext(), "Only 1 word allowed", Toast.LENGTH_LONG).show()
      return
    }
    viewModel.addWord(word)
  }

  private fun setupObservers() {
    viewModel.wordTvText.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text -> wordTv.text = text }

    viewModel.transliterations.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { array ->

      flowLayout.removeAllViews()

      for (word in array) {
        val view = layoutInflater.inflate(R.layout.item_float_word, null)
        view.word.text = word
        view.removeImageView.setOnClickListener { viewModel.removeWord(word) }
        flowLayout.addView(view)
      }
      // Clear the edittext
      textTransliteration.setText("")
    }

  }

  fun EditText.onSubmit(func: () -> Unit) {
    setOnEditorActionListener { _, actionId, _ ->

      if (actionId == EditorInfo.IME_ACTION_DONE) {
        func()
      }
      true
    }
  }

}
