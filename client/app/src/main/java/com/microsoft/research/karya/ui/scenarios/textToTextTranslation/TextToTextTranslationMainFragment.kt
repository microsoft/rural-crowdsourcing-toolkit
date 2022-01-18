// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
package com.microsoft.research.karya.ui.scenarios.textToTextTranslation

import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.EditText
import android.widget.LinearLayout
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_text_translation_bagofwords.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

@AndroidEntryPoint
class TextToTextTranslationMainFragment : BaseMTRendererFragment(R.layout.microtask_text_translation_bagofwords) {
  override val viewModel: TextToTextTranslationViewModel by viewModels()
  val args: TextToTextTranslationMainFragmentArgs by navArgs()


  private lateinit var editText: EditText
  var bagOfWords = ""
  var bagOfWordsCount = 0

  override fun requiredPermissions(): Array<String> {
    return emptyArray()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    requireActivity().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    super.onCreate(savedInstanceState)
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

    textTranslationBOW.setLogging { viewModel::logger }
    resetUI()

    nextBtn.setOnClickListener { onNextClick() }
  }

  private fun showError(error: String) {
//    errorTv.text = error
//    errorTv.visible()
  }

  private fun onNextClick() {
    if (editText.text.toString().isEmpty()) {
      showError(getString(R.string.text_translation_no_score_provided_text))
      return
    }
//    errorTv.gone()
    //TODO: Reset Progress Bar
    viewModel.setTarget(editText.text.toString())
    viewModel.handleNextClick()
  }

  private fun setupObservers() {

    viewModel.inputUpdates.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { update ->
      sourceTextTv.text = update.first
      GlobalScope.launch(Dispatchers.Main) {
        textTranslationBOW.setupTranslationTask(
          update.first,
          update.second,
          false
        )
      }
    }

    // TODO: Move to onViewCreated
    viewModel.support.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) {}
  }

  private fun handleTextChange() {

    /*Log the number of characters changed
    * Sets the next button state as active after a character has been typed */
    editText.addTextChangedListener(object : TextWatcher {
      var previousText: String = ""
      override fun beforeTextChanged(
        charSequence: CharSequence,
        i: Int,
        i1: Int,
        i2: Int
      ) {
      }

      override fun onTextChanged(
        newText: CharSequence,
        i1: Int,
        i2: Int,
        i3: Int
      ) {
        if (newText.length > previousText.length) {
          viewModel.logger("Text added: " + (newText.length - previousText.length))
          Log.i("textchange", "Text added: " + (newText.length - previousText.length))
        } else {
          viewModel.logger("Text removed: " + (previousText.length - newText.length))
          Log.i("textchange", "Text removed: " + (previousText.length - newText.length))
        }
        previousText = newText.toString()
      }

      override fun afterTextChanged(s: Editable) {
        bagOfWordsCount += 1
      }
    })

  }

  private fun resetUI() {
    editText = getEditText()
    bagOfWordsCount = 0
    val editTextParams = getEditTextParams()
    editText.layoutParams = editTextParams
    textTranslationBOW.setupINMTBagOfWords(editText, editTextParams)
    handleTextChange()
  }


  private fun getEditText(): EditText {
    /*Set the parameters for edittext, used for BOW*/
    editText = EditText(requireActivity())
    editText.hint = "Type your translation here"
    editText.maxLines = 4
    editText.setText("")
    editText.setPadding(30, 30, 30, 30)
    editText.setTextColor(Color.parseColor("#000000"))
    editText.setBackgroundResource(R.drawable.border_black)

    return editText
  }

  private fun getEditTextParams(): LinearLayout.LayoutParams {
    val editTextParams = LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT
    )
    editTextParams.setMargins(35, 20, 35, 20)
    return editTextParams
  }
}
