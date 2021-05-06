package com.microsoft.research.karya.ui.login.otp

import android.os.Bundle
import android.view.View
import android.widget.ImageView
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
import kotlinx.coroutines.flow.collect

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

    binding.resendOTPBtn.setOnClickListener { viewModel.resendOTP() }

    binding.otpEt.doAfterTextChanged { otp ->
      if (otp?.length == AppConstants.OTP_LENGTH) {
        // enable next button
      } else {
        // disable next button
      }
    }

    requestSoftKeyFocus(binding.otpEt)
  }

  private fun observeEffects() {
    lifecycleScope.launchWhenStarted {
      viewModel.otpEffects.collect { effect ->
        when (effect) {
          is OTPEffects.Navigate -> navigate()
        }
      }
    }
  }

  private fun observeUi() {
    viewModel.otpUiState.observe(lifecycle, lifecycleScope) { state ->
      when (state) {
        is OTPUiState.Success -> showSuccessUi()
        // TODO: Change this to a correct mapping
        is OTPUiState.Error -> showErrorUi(state.throwable.message!!)
        OTPUiState.Initial -> showInitialUi()
        OTPUiState.Loading -> showLoadingUi()
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      otpEt.text.clear()
      invalidOTPTv.gone()
      resendOTPBtn.gone()
      otpEt.enable()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      invalidOTPTv.gone()
      resendOTPBtn.gone()
      otpEt.disable()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      invalidOTPTv.gone()
      resendOTPBtn.gone()
      otpEt.enable()
      otpStatusIv.showSuccess()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      invalidOTPTv.text = message
      invalidOTPTv.visible()
      resendOTPBtn.gone()
      otpEt.disable()
      otpStatusIv.showFailure()

      requestSoftKeyFocus(binding.otpEt)
    }
  }

  private fun navigate(destination: OTPDestination) {
<<<<<<< Updated upstream
    when (destination) {
=======
    when(destination) {
>>>>>>> Stashed changes
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

  private fun ImageView.showSuccess() {
    with(binding) {
      otpStatusIv.setImageResource(0)
      otpStatusIv.setImageResource(R.drawable.ic_check_grey)
    }
  }

  private fun ImageView.showFailure() {
    with(binding) {
      otpStatusIv.setImageResource(0)
      otpStatusIv.setImageResource(R.drawable.ic_quit_select)
    }
  }
}
