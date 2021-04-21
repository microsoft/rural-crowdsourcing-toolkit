package com.microsoft.research.karya.ui.registration

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.TypedValue
import android.view.View
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentPhoneNumberBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PhoneNumberFragment : Fragment(R.layout.fragment_phone_number) {

  private val binding by viewBinding(FragmentPhoneNumberBinding::bind)

  private val PHONE_NUMBER_LENGTH = 10
  private lateinit var registrationActivity: RegistrationActivity
  private lateinit var baseActivity: BaseActivity
  //    private lateinit var startForResult: ActivityResultLauncher<Intent>

  /** Callback to move forward in navigation graph after successful OTP send */
  var startForResult =
      registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
          result: ActivityResult ->
        if (result.resultCode == Activity.RESULT_OK) {
          findNavController().navigate(R.id.action_phoneNumberFragment_to_OTPFragment)
        }
      }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    registrationActivity = activity as RegistrationActivity
    baseActivity = activity as BaseActivity

    registrationActivity.current_assistant_audio = R.string.audio_phone_number_prompt

    /** Set the phone number font size to the same value as the phantom text view font size */
    binding.phantomPhoneNumberTv.addOnLayoutChangeListener {
        _: View,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int ->
      binding.phoneNumberEt.setTextSize(
          TypedValue.COMPLEX_UNIT_PX, binding.phantomPhoneNumberTv.textSize)
    }

    /** Set phone number text change listener */
    binding.phoneNumberEt.addTextChangedListener(
        object : TextWatcher {
          override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
          override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

          override fun afterTextChanged(s: Editable?) {
            if (s?.length == PHONE_NUMBER_LENGTH) {
              handlePhoneNumberReady()
            } else {
              handlePhoneNumberNotReady()
            }
          }
        })
    baseActivity.requestSoftKeyFocus(binding.phoneNumberEt)

    /** Phone number next button should not be clickable by default */
    binding.phoneNumberNextIv.setOnClickListener {
      binding.phoneNumberNextIv.visibility = View.INVISIBLE
      handleNextClick()
    }
    binding.phoneNumberNextIv.isClickable = false
  }

  override fun onResume() {
    super.onResume()
    registrationActivity.onAssistantClick()
  }

  /** Update UI when the phone number is ready */
  private fun handlePhoneNumberReady() {
    lifecycleScope.launch(Dispatchers.Main) {
      binding.phoneNumberNextIv.setImageResource(0)
      binding.phoneNumberNextIv.setImageResource(R.drawable.ic_next_enabled)
      binding.phoneNumberNextIv.isClickable = true
    }
  }

  /** Update UI when the phone number is ready */
  private fun handlePhoneNumberNotReady() {
    lifecycleScope.launch(Dispatchers.Main) {
      binding.phoneNumberNextIv.setImageResource(0)
      binding.phoneNumberNextIv.setImageResource(R.drawable.ic_next_disabled)
      binding.phoneNumberNextIv.isClickable = false
    }
  }

  /** On next click, hide keyboard. Send request to send OTP to the phone number */
  private fun handleNextClick() {
    baseActivity.hideKeyboard()
    WorkerInformation.phone_number = binding.phoneNumberEt.text.toString()

    startForResult.launch(Intent(activity, SendOTPActivity::class.java))
  }
}
