package com.microsoft.research.karya.ui.onboarding.accesscode

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentAccessCodeBinding
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class AccessCodeFragment : Fragment(R.layout.fragment_access_code) {
  private val binding by viewBinding(FragmentAccessCodeBinding::bind)
  private val viewModel by viewModels<AccessCodeViewModel>()

  private val creationCodeLength = 16
  private val creationCodeEtMax = creationCodeLength + (creationCodeLength - 1) / 4

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()
    observeEffects()
  }

  private fun setupViews() {
    with(binding) {
      creationCodeEt.addTextChangedListener(
        object : SeparatorTextWatcher('-', 4) {
          override fun onAfterTextChanged(text: String, position: Int) {
            creationCodeEt.run {
              setText(text)
              setSelection(position)
            }

            if (creationCodeEt.length() == creationCodeEtMax) {
              enableButton()
              creationCodeEt.setSelection(creationCodeEtMax)
            } else {
              disableButton()
            }
          }
        }
      )

      submitAccessCodeBtn.setOnClickListener {
        val accessCode = binding.creationCodeEt.text.toString().replace("-", "")
        viewModel.checkAccessCode(accessCode)
      }

      requestSoftKeyFocus(creationCodeEt)
    }
  }

  private fun observeUi() {
    viewModel.accessCodeUiState.observe(viewLifecycle, viewLifecycleScope) { state ->
      when (state) {
        is AccessCodeUiState.Success -> showSuccessUi(state.languageCode)
        is AccessCodeUiState.Error -> showErrorUi(state.throwable.message!!)
        AccessCodeUiState.Initial -> showInitialUi()
        AccessCodeUiState.Loading -> showLoadingUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.accessCodeEffects.observe(viewLifecycle, viewLifecycleScope) { effect ->
      when (effect) {
        AccessCodeEffects.Navigate -> navigateToConsentFormFragment()
      }
    }
  }

  private fun navigateToConsentFormFragment() {
    findNavController().navigate(R.id.action_accessCodeFragment2_to_fileDownloadFragment2)
  }

  private fun showSuccessUi(languageCode: String) {
    updateActivityLanguage(languageCode)

    hideLoading()
    hideError()
    enableButton()
  }

  private fun showErrorUi(error: String) {
    showError(error)
    hideLoading()
    enableButton()
    requestSoftKeyFocus(binding.creationCodeEt)
  }

  private fun showInitialUi() {
    hideLoading()
    disableButton()
    hideError()
    binding.creationCodeEt.text.clear()
  }

  private fun showLoadingUi() {
    showLoading()
    disableButton()
  }

  private fun showError(message: String) {
    with(binding) { creationCodeErrorTv.text = message }
  }

  private fun hideError() {
    with(binding) { creationCodeErrorTv.text = "" }
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
      submitAccessCodeBtn.gone()
      creationCodeEt.isEnabled = false
    }
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      submitAccessCodeBtn.visible()
      creationCodeEt.isEnabled = true
    }
  }

  private fun disableButton() {
    binding.submitAccessCodeBtn.disable()
  }

  private fun enableButton() {
    binding.submitAccessCodeBtn.enable()
  }

  private fun updateActivityLanguage(language: String) {
    (requireActivity() as MainActivity).setActivityLocale(language)
  }
}
