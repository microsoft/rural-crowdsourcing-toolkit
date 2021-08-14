package com.microsoft.research.karya.ui.onboarding.login.otp

import android.os.Bundle
import android.view.View
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentOtpBinding
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.AppConstants
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.finish
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

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
    // registrationActivity.current_assistant_audio = R.string.audio_otp_prompt
    binding.appTb.setTitle(getString(R.string.s_otp_title))
    binding.appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.OTP_PROMPT) }

    binding.resendOTPBtn.setOnClickListener {
      binding.resendOTPBtn.gone()
      viewModel.resendOTP()
    }

    binding.otpEt.doAfterTextChanged { otp ->
      if (otp?.length == AppConstants.OTP_LENGTH) {
        enableNextButton()
      } else {
        disableNextButton()
      }
    }

    binding.otpNextIv.setOnClickListener { viewModel.verifyOTP(binding.otpEt.text.toString()) }

    requestSoftKeyFocus(binding.otpEt)
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
      Destination.TempDataFlow -> navigateToTempDataFlow()
      Destination.Dashboard -> navigateToDashBoard()
      else -> {
      }
    }
  }

  private fun navigateToDashBoard() {
    findNavController().navigate(R.id.action_global_dashboardActivity4)
    finish()
  }

  private fun navigateToTempDataFlow() {
    findNavController().navigate(R.id.action_OTPFragment2_to_tempDataFlow)
  }

  private fun enableNextButton() {
    binding.otpNextIv.apply {
      setImageResource(0)
      setImageResource(R.drawable.ic_next_enabled)
      isClickable = true
    }
  }

  private fun disableNextButton() {
    binding.otpNextIv.apply {
      setImageResource(0)
      setImageResource(R.drawable.ic_next_disabled)
      isClickable = false
    }
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
      otpNextIv.gone()
      otpEt.disable()
    }
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      otpNextIv.visible()
      otpEt.enable()
    }
  }

  private fun showError(message: String) {
    with(binding) {
      invalidOTPTv.text = message
      invalidOTPTv.visible()
      otpStatusIv.apply {
        visible()
        setImageResource(0)
        setImageResource(R.drawable.ic_quit_select)
      }
    }
  }

  private fun hideError() {
    with(binding) {
      invalidOTPTv.gone()
      otpStatusIv.gone()
    }
  }
}
