package com.microsoft.research.karya.ui.scenarios.transliteration

import android.graphics.Color
import android.os.Bundle
import android.text.InputFilter
import android.text.InputType
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import androidx.core.content.ContextCompat
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.transliteration.UniversalTransliterationViewModel.WordVerificationStatus
import com.microsoft.research.karya.ui.scenarios.transliteration.validator.Validator
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.item_float_word.view.*
import kotlinx.android.synthetic.main.transliteration_main_fragment.*

@AndroidEntryPoint
class UniversalTransliterationMainFragment :
  BaseMTRendererFragment(R.layout.transliteration_main_fragment) {
  override val viewModel: UniversalTransliterationViewModel by viewModels()
  val args: UniversalTransliterationMainFragmentArgs by navArgs()

  private var prevInvalidWord: String = ""

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
    viewModel.setupViewmodel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    textTransliteration.inputType =
      InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD or InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
    textTransliteration.filters = arrayOf(
      InputFilter { source, start, end, dest, dstart, dend ->
        return@InputFilter source.replace(Regex("[^a-zA-Z ]*"), "")
      }
    )

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString ?: ""
    wordTv.text = recordInstruction

    addBtn.setOnClickListener { addWord() }

    textTransliteration.onSubmit { addWord() }

    nextBtn.setOnClickListener { onNextClick() }

    Validator.init()
  }

  private fun addWord() {

    errorTv.gone() // Remove any existing errors

    val word = textTransliteration.text.toString()
    val outputVariants = viewModel.outputVariants.value!!
    val inputVariants = viewModel.inputVariants.value!!

    if (word.contains(" ")) {
      showError("Only 1 word allowed")
      return
    }

    if (inputVariants.values.count { wordDetail ->
        wordDetail.verificationStatus == WordVerificationStatus.NEW
      } == viewModel.limit) {
      showError("Only upto ${viewModel.limit} words are allowed.")
      return
    }

    if (viewModel.mlFeedback
      && !Validator.isValid(viewModel.sourceLanguage, viewModel.sourceWord, word)
      && word != prevInvalidWord) {
      prevInvalidWord = word
      showError(
        "This transliteration doesn't seem right. Please check it and " +
          "press add again if you think its correct"
      )
      return
    }

    if (word.isEmpty()) {
      showError("Please enter a word")
      return
    }

    if (outputVariants.containsKey(word) || inputVariants.containsKey(word)) {
      showError("The word is already present")
      return
    }
    viewModel.addWord(word)
  }

  private fun showError(error: String) {
    errorTv.text = error
    errorTv.visible()
  }

  private fun onNextClick() {
    if (!viewModel.allowValidation && viewModel.inputVariants.value!!.size == 0) {
      showError("Please enter atleast one word")
      return
    } else if (viewModel.allowValidation) {
      var atleastOneValidNew = viewModel.inputVariants.value!!.isNotEmpty()
      var noUnknowns = true
      for ((word, wordDetail) in viewModel.outputVariants.value!!) {
        when (wordDetail.verificationStatus) {
          WordVerificationStatus.UNKNOWN -> {
            noUnknowns = false
            break
          }
          WordVerificationStatus.VALID -> {
            atleastOneValidNew = true
          }
        }
      }
      if (!noUnknowns) {
        showError("Please validate all variants")
        return
      }
      if (!atleastOneValidNew) {
        showError("Please enter at least one valid or new variant")
        return
      }
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

    viewModel.outputVariants.observe(viewLifecycleOwner) { variants ->

      verifyFlowLayout.removeAllViews()

      for ((word, wordDetail) in variants) {
        val view = layoutInflater.inflate(R.layout.item_float_word, null)
        view.word.text = word

        when (wordDetail.verificationStatus) {
          WordVerificationStatus.VALID -> setValidUI(view)
          WordVerificationStatus.INVALID -> setInvaidUI(view)
          WordVerificationStatus.UNKNOWN -> setUnknownUI(view)
        }

        view.setOnClickListener {

          // If validation is not allowed return
          if (!viewModel.allowValidation) return@setOnClickListener

          when (wordDetail.verificationStatus) {
            WordVerificationStatus.VALID -> viewModel.modifyStatus(
              word,
              WordVerificationStatus.INVALID
            )
            WordVerificationStatus.INVALID, WordVerificationStatus.UNKNOWN -> viewModel.modifyStatus(
              word,
              WordVerificationStatus.VALID
            )
          }

        }

        verifyFlowLayout.addView(view)

      }
    }

    viewModel.inputVariants.observe(viewLifecycleOwner) { variants ->
      userVariantLayout.removeAllViews()
      for (word in variants.keys.reversed()) {
        val view = layoutInflater.inflate(R.layout.item_float_word, null)
        view.word.text = word

        setNewUI(view)

        view.removeImageView.setOnClickListener { viewModel.removeWord(word) }

        userVariantLayout.addView(view)
      }
      // Clear the edittext
      textTransliteration.setText("")
    }

  }

  private fun setValidUI(view: View) {
    view.float_word_card.background.setTint(
      ContextCompat.getColor(
        requireContext(),
        R.color.light_green
      )
    )
    view.removeImageView.gone()
  }

  private fun setInvaidUI(view: View) {
    view.float_word_card.background.setTint(
      ContextCompat.getColor(
        requireContext(),
        R.color.light_red
      )
    )
    view.removeImageView.gone()
  }

  private fun setNewUI(view: View) {
    view.float_word_card.background.setTint(
      ContextCompat.getColor(
        requireContext(),
        R.color.light_yellow
      )
    )
    view.removeImageView.visible()
  }

  private fun setUnknownUI(view: View) {
    view.float_word_card.background.setTint(Color.LTGRAY)
    view.removeImageView.gone()
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

