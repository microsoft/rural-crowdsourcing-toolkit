package com.microsoft.research.karya.ui.onboarding.login.phone

import android.os.Bundle
import android.view.View
import android.widget.ImageView
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentPhoneNumberBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.AppConstants.PHONE_NUMBER_LENGTH
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.extensions.doOnlyOnce
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.hideKeyboard
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class PhoneNumberFragment : BaseFragment(R.layout.fragment_phone_number) {

  private val binding by viewBinding(FragmentPhoneNumberBinding::bind)
  private val viewModel by viewModels<PhoneNumberViewModel>()
  override val TAG: String = "PHONE_NUMBER_FRAGMENT"

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()
    observeEffects()
    requestSoftKeyFocus(binding.phoneNumberEt)
  }

  override fun onResume() {
    super.onResume()
    viewLifecycleScope.launchWhenResumed {
      requireContext().dataStore.doOnlyOnce(audioTag) {
        assistant.playAssistantAudio(AssistantAudio.PHONE_NUMBER_PROMPT)
      }
    }
  }

  private fun setupViews() {
    // registrationActivity = activity as RegistrationActivity
    // registrationActivity.current_assistant_audio = R.string.audio_phone_number_prompt

    with(binding) {
      phoneNumberEt.doAfterTextChanged { phoneNumber ->
        if (!phoneNumber.isNullOrEmpty() && phoneNumber.length == PHONE_NUMBER_LENGTH) {
          phoneNumberNextIv.handlePhoneNumberReady()
        } else {
          phoneNumberNextIv.handlePhoneNumberNotReady()
        }
      }

      phoneNumberNextIv.setOnClickListener { handleNextClick(phoneNumberEt.text.toString()) }

      appTb.setTitle(getString(R.string.s_phone_number_title))
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
    findNavController().navigate(R.id.action_phoneNumberFragment2_to_OTPFragment2)
  }

  private fun showInitialUi() {
    with(binding) {
      failToSendOtpTv.gone()
      phoneNumberNextIv.handlePhoneNumberNotReady()
      hideLoading()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      failToSendOtpTv.gone()
      showLoading()
      phoneNumberNextIv.handlePhoneNumberNotReady()
      phoneNumberNextIv.invisible()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      failToSendOtpTv.gone()
      hideLoading()
      phoneNumberNextIv.handlePhoneNumberReady()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      failToSendOtpTv.text = message
      failToSendOtpTv.visible()
      hideLoading()
      phoneNumberNextIv.handlePhoneNumberReady()
    }
  }

  private fun handleNextClick(phoneNumber: String) {
    hideKeyboard()
    viewModel.sendOTP(phoneNumber)
  }

  private fun ImageView.handlePhoneNumberReady() {
    setImageResource(0)
    setImageResource(R.drawable.ic_next_enabled)
    isClickable = true
  }

  private fun ImageView.handlePhoneNumberNotReady() {
    setImageResource(0)
    setImageResource(R.drawable.ic_next_disabled)
    isClickable = false
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      phoneNumberNextIv.visible()
    }
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
      phoneNumberNextIv.gone()
    }
  }
}
