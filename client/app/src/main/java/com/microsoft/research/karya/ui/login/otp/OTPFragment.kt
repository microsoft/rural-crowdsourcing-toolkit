package com.microsoft.research.karya.ui.login.otp

import android.os.Bundle
import android.view.View
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentOtpBinding
import com.microsoft.research.karya.utils.AppConstants
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.finish
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class OTPFragment : Fragment(R.layout.fragment_otp) {

  private val binding by viewBinding(FragmentOtpBinding::bind)
  private val viewModel by hiltNavGraphViewModels<OTPViewModel>(R.id.registration_navigation)

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupView()
    observeUi()
    observeEffects()
  }

  private fun setupView() {
    // registrationActivity.current_assistant_audio = R.string.audio_otp_prompt
    binding.appTb.setTitle(getString(R.string.s_otp_title))

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
    viewModel.otpUiState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
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
    viewModel.otpEffects.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { effect ->
      when (effect) {
        is OTPEffects.Navigate -> navigate(effect.data)
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      otpEt.text.clear()
      hideError()
      hideLoading()
      disableNextButton()
      otpEt.enable()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      hideError()
      showLoading()
      disableNextButton()
      otpEt.disable()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      hideError()
      hideLoading()
      enableNextButton()
      otpEt.enable()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      showError(message)
      hideLoading()
      disableNextButton()
      otpEt.enable()
      requestSoftKeyFocus(binding.otpEt)
    }
  }

  private fun navigate(destination: OTPDestination) {
    when (destination) {
      OTPDestination.AgeSelection -> TODO()
      OTPDestination.Dashboard -> navigateToDashBoard()
      OTPDestination.GenderSelection -> TODO()
      OTPDestination.ProfilePicSelection -> navigateToProfilePicture()
    }
  }

  private fun navigateToDashBoard() {
    findNavController().navigate(R.id.action_OTPFragment_to_dashboardActivity2)
    finish()
  }

  private fun navigateToProfilePicture() {
    findNavController().navigate(R.id.action_OTPFragment_to_profilePictureFragment)
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
    }
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      otpNextIv.visible()
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
