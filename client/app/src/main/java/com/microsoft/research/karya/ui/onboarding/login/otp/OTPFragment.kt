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
    binding.appTb.setTitle(getString(R.string.otp_title))
    binding.appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.OTP_PROMPT) }

    binding.resendOTPBtn.setOnClickListener {
      binding.resendOTPBtn.gone()
      viewModel.resendOTP()
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
        is OTPUiState.Error -> showErrorUi(state.throwable.message!!)
        OTPUiState.Initial -> showInitialUi()
        OTPUiState.Loading -> showLoadingUi()
      }
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
    with(binding) {
      hideError()
      showLoading()
      disableNextButton()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      hideError()
      hideLoading()
      enableNextButton()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      showError(message)
      hideLoading()
      enableNextButton()
      requestSoftKeyFocus(binding.otpEt)
    }
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
