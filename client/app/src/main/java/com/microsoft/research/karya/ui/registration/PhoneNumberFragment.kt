package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.view.View
import android.widget.ImageView
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.OtpSendState
import com.microsoft.research.karya.databinding.FragmentPhoneNumberBinding
import com.microsoft.research.karya.utils.AppConstants.PHONE_NUMBER_LENGTH
import com.microsoft.research.karya.utils.extensions.hideKeyboard
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.visible
import com.microsoft.research.karya.utils.viewBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class PhoneNumberFragment : Fragment(R.layout.fragment_phone_number) {

  private val binding by viewBinding(FragmentPhoneNumberBinding::bind)
  private val viewModel by activityViewModels<RegistrationViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    setupObservers()
    requestSoftKeyFocus(binding.phoneNumberEt)
  }

  override fun onResume() {
    super.onResume()
    // registrationActivity.onAssistantClick()
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

      phoneNumberNextIv.setOnClickListener {
        phoneNumberNextIv.invisible()
        handleNextClick(phoneNumberEt.text.toString())
      }
      phoneNumberNextIv.isClickable = false

      appTb.setTitle(getString(R.string.s_phone_number_title))
    }
  }

  private fun setupObservers() {
    viewModel.currOtpSendState.observe(viewLifecycleOwner) { sent ->
      if (sent == OtpSendState.SUCCESS) {
        onSendOtpSuccess()
      }

      if (sent == OtpSendState.FAIL) {
        onSendOtpFailure()
      }
    }
  }

  private fun onSendOtpSuccess() {
    binding.failToSendOtpTv.visibility = View.INVISIBLE
    findNavController().navigate(R.id.action_phoneNumberFragment_to_OTPFragment)
    viewModel.resetOtpSendState()
  }

  private fun onSendOtpFailure() {
    binding.failToSendOtpTv.visibility = View.VISIBLE
    binding.failToSendOtpTv.text = getString(viewModel.phoneNumberFragmentErrorId)
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
    visible()
    setImageResource(0)
    setImageResource(R.drawable.ic_next_disabled)
    isClickable = false
  }
}
