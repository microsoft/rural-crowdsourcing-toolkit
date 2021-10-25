package com.microsoft.research.karya.ui.onboarding.login.phone

import android.os.Bundle
import android.view.View
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentPhoneNumberBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

private const val PHONE_NUMBER_LENGTH = 10

@AndroidEntryPoint
class PhoneNumberFragment : BaseFragment(R.layout.fragment_phone_number) {

  private val binding by viewBinding(FragmentPhoneNumberBinding::bind)
  private val viewModel by viewModels<PhoneNumberViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()
    observeEffects()
  }

  override fun onResume() {
    super.onResume()
    assistant.playAssistantAudio(AssistantAudio.PHONE_NUMBER_PROMPT)
  }

  private fun setupViews() {

    with(binding) {
      // Check if phone number can be submitted
      phoneNumberEt.doAfterTextChanged { phoneNumber ->
        hideError()

        if (!phoneNumber.isNullOrEmpty() && phoneNumber.length == PHONE_NUMBER_LENGTH) {
          numPad.enableDoneButton()
        } else {
          numPad.disableDoneButton()
        }
      }

      // Set on done listener for the num pad
      numPad.setOnDoneListener { handleNextClick(phoneNumberEt.text.toString()) }

      appTb.setTitle(getString(R.string.phone_number_title))
      appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.PHONE_NUMBER_PROMPT) }
    }
  }

  private fun observeUi() {
    viewModel.phoneNumberUiState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      when (state) {
        is PhoneNumberUiState.Error -> showErrorUi(getErrorMessage(state.throwable))
        PhoneNumberUiState.Initial -> showInitialUi()
        PhoneNumberUiState.Loading -> showLoadingUi()
        PhoneNumberUiState.Success -> showSuccessUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.phoneNumberEffects.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { effect ->
      when (effect) {
        PhoneNumberEffects.Navigate -> navigateToOTPFragment()
      }
    }
  }

  private fun navigateToOTPFragment() {
    findNavController().navigate(R.id.action_phoneNumberFragment_to_OTPFragment)
  }

  private fun showInitialUi() {
    binding.numPad.disableDoneButton()
    hideError()
    hideLoading()
  }

  private fun showLoadingUi() {
    hideError()
    showLoading()
  }

  private fun showSuccessUi() {
    hideError()
    hideLoading()
  }

  private fun showErrorUi(message: String) {
    showError(message)
    hideLoading()
  }

  private fun handleNextClick(phoneNumber: String) {
    viewModel.sendOTP(phoneNumber)
  }

  private fun hideLoading() {
    binding.loadingPb.gone()
  }

  private fun showLoading() {
    binding.loadingPb.visible()
  }

  private fun showError(message: String) {
    with(binding.sendOTPErrorTv) {
      text = message
      visible()
    }
  }

  private fun hideError() {
    binding.sendOTPErrorTv.invisible()
  }
}
