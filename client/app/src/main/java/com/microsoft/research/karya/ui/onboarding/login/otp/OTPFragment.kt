package com.microsoft.research.karya.ui.onboarding.login.otp

import android.os.Bundle
import android.view.View
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentOtpBinding
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

private const val OTP_LENGTH = 6

@AndroidEntryPoint
class OTPFragment : BaseFragment(R.layout.fragment_otp) {

  private val binding by viewBinding(FragmentOtpBinding::bind)
  private val viewModel by viewModels<OTPViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupView()
    observeUi()
    observeEffects()
  }

  override fun onResume() {
    super.onResume()
    assistant.playAssistantAudio(AssistantAudio.OTP_PROMPT)
  }

  private fun setupView() {
    viewModel.retrievePhoneNumber()
    binding.appTb.setTitle(getString(R.string.otp_title))
    binding.appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.OTP_PROMPT) }

    binding.resendOTPBtn.setOnClickListener {
      binding.resendOTPBtn.gone()
      viewModel.resendOTP()
    }

    // To change phone number, just go back
    // TODO: this may not always be true.
    binding.changePhoneNumberBtn.setOnClickListener {
      requireActivity().onBackPressed()
    }

    binding.otpEt.doAfterTextChanged { otp ->
      if (otp?.length == OTP_LENGTH) {
        enableNextButton()
      } else {
        disableNextButton()
      }
    }

    binding.numPad.setOnDoneListener { viewModel.verifyOTP(binding.otpEt.text.toString()) }
  }

  private fun observeUi() {
    viewModel.otpUiState.observe(viewLifecycle, viewLifecycleScope) { state ->
      when (state) {
        is OTPUiState.Success -> showSuccessUi()
        // TODO: Change this to a correct mapping
        is OTPUiState.Error -> showErrorUi(getErrorMessage(state.throwable))
        OTPUiState.Initial -> showInitialUi()
        OTPUiState.Loading -> showLoadingUi()
      }
    }

    viewModel.phoneNumber.observe(viewLifecycle, viewLifecycleScope) { phoneNumber ->
      binding.otpPromptTv.text = getString(R.string.otp_prompt).replace("0000000000", phoneNumber)
    }
  }

  private fun observeEffects() {
    viewModel.otpEffects.observe(viewLifecycle, viewLifecycleScope) { effect ->
      when (effect) {
        is OTPEffects.Navigate -> navigate(effect.destination)
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      otpEt.text.clear()
      hideError()
      hideLoading()
      disableNextButton()
    }
  }

  private fun showLoadingUi() {
    hideError()
    showLoading()
    disableNextButton()
  }

  private fun showSuccessUi() {
    hideError()
    hideLoading()
    enableNextButton()
  }

  private fun showErrorUi(message: String) {
    showError(message)
    hideLoading()
    enableNextButton()
  }

  private fun navigate(destination: Destination) {
    when (destination) {
      Destination.Dashboard -> navigateToDashBoard()
      else -> {
      }
    }
  }

  private fun navigateToDashBoard() {
    findNavController().navigate(R.id.action_global_dashboardActivity)
  }

  private fun enableNextButton() {
    binding.numPad.enableDoneButton()
  }

  private fun disableNextButton() {
    binding.numPad.disableDoneButton()
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
      otpEt.disable()
    }
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      otpEt.enable()
    }
  }

  private fun showError(message: String) {
    with(binding) {
      invalidOTPTv.text = message
      invalidOTPTv.visible()
    }
  }

  private fun hideError() {
    with(binding) {
      invalidOTPTv.gone()
    }
  }
}
