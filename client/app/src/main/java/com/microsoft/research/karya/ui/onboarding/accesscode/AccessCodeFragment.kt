package com.microsoft.research.karya.ui.onboarding.accesscode

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.NgFragmentAccessCodeBinding
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class AccessCodeFragment : Fragment(R.layout.fragment_access_code) {
  private val binding by viewBinding(NgFragmentAccessCodeBinding::bind)
  private val viewModel by viewModels<AccessCodeViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()
    observeEffects()
  }

  private fun setupViews() {
    with(binding) {
      accessCodeEt.addTextChangedListener(
        object : SeparatorTextWatcher('-', 4) {
          override fun onAfterTextChanged(text: String, position: Int) {
            accessCodeEt.run {
              setText(text)
              setSelection(position)
            }
          }
        }
      )

      accessCodeEt.doAfterTextChanged {
        if (accessCodeEt.length() > 0) {
          numPad.enableDoneButton()
        } else {
          numPad.disableDoneButton()
        }

        hideError()
      }

      numPad.setOnDoneListener { handleSubmit() }
      numPad.disableDoneButton()
    }
  }

  private fun handleSubmit() {
    val accessCode = binding.accessCodeEt.text.toString().replace("-", "")
    val decodedURL = AccessCodeDecoder.decodeURL(requireContext(), accessCode)
    // Set the decoded URL for the app to be used
    lifecycleScope.launch {
      viewModel.setURL(decodedURL)
      viewModel.checkAccessCode(accessCode)
    }
  }

  private fun observeUi() {
    viewModel.accessCodeUiState.observe(viewLifecycle, viewLifecycleScope) { state ->
      when (state) {
        is AccessCodeUiState.Success -> showSuccessUi(state.languageCode)
        is AccessCodeUiState.Error -> showErrorUi()
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
    findNavController().navigate(R.id.action_accessCodeFragment_to_fileDownloadFragment)
  }

  private fun showSuccessUi(languageCode: String) {
    updateActivityLanguage(languageCode)
    hideLoading()
    hideError()
    enableDoneButton()
  }

  private fun showErrorUi() {
    showError()
    hideLoading()
    enableDoneButton()
  }

  private fun showInitialUi() {
    hideLoading()
    disableDoneButton()
    hideError()
    binding.accessCodeEt.text.clear()
  }

  private fun showLoadingUi() {
    showLoading()
    disableDoneButton()
  }

  private fun showError() {
    binding.accessCodeErrorIv.visible()
  }

  private fun hideError() {
    binding.accessCodeErrorIv.invisible()
  }

  private fun showLoading() {
    binding.loadingPb.visible()
  }

  private fun hideLoading() {
    binding.loadingPb.gone()
  }

  private fun disableDoneButton() {
    binding.numPad.disableDoneButton()
  }

  private fun enableDoneButton() {
    binding.numPad.enableDoneButton()
  }

  private fun updateActivityLanguage(language: String) {
    (requireActivity() as MainActivity).setActivityLocale(language)
  }
}
