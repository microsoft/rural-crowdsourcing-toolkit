package com.microsoft.research.karya.ui.onboarding.login.phone

import android.os.Bundle
import android.view.View
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.microsoft.research.karya.databinding.NgFragmentPhoneNumberBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

private const val PHONE_NUMBER_LENGTH = 10

@AndroidEntryPoint
class PhoneNumberFragment : BaseFragment(R.layout.ng_fragment_phone_number) {

  private val binding by viewBinding(NgFragmentPhoneNumberBinding::bind)
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
        is PhoneNumberUiState.Error -> showErrorUi(state.throwable.message!!)
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
    with(binding) {
      sendOTPErrorTv.invisible()
      numPad.disableDoneButton()
      hideLoading()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      sendOTPErrorTv.invisible()
      showLoading()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      sendOTPErrorTv.invisible()
      hideLoading()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      sendOTPErrorTv.text = message
      sendOTPErrorTv.visible()
      hideLoading()
    }
  }

  private fun handleNextClick(phoneNumber: String) {
    hideKeyboard()
    viewModel.sendOTP(phoneNumber)
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
    }
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
    }
  }
}
