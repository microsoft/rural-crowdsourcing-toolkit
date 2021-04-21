// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import kotlinx.android.synthetic.main.activity_otp.*
import kotlinx.coroutines.launch

private const val OTP_LENGTH = 6

class OTPActivity : BaseActivity(useAssistant = true) {

  /** Android strings */
  private var otpPromptMessage: String = ""
  private var invalidOTPMessage: String = ""
  private var resendOTPMessage: String = ""

  override fun onCreate(savedInstanceState: Bundle?) {
    setContentView(R.layout.activity_otp)
    super.onCreate(savedInstanceState)

    /** Resend OTP handler */
    resendOTPBtn.setOnClickListener { resendOTP() }

    /** Set listener for the OTP text box */
    otpEt.addTextChangedListener(
        object : TextWatcher {
          override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
          override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

          override fun afterTextChanged(s: Editable?) {
            if (s?.length == OTP_LENGTH) handleOTPReady() else handleOTPNotReady()
          }
        })
    requestSoftKeyFocus(otpEt)
  }

  /** Get strings for this activity */
  override suspend fun getStringsForActivity() {
    otpPromptMessage = getValueFromName(R.string.otp_prompt)
    invalidOTPMessage = getValueFromName(R.string.invalid_otp)
    resendOTPMessage = getValueFromName(R.string.resend_otp)
  }

  /** Set initial UI strings */
  override suspend fun setInitialUIStrings() {
    otpPromptTv.text = otpPromptMessage
    invalidOTPTv.text = invalidOTPMessage
    resendOTPBtn.text = resendOTPMessage
  }

  /** On assistant click, play the OTP prompt */
  override fun onAssistantClick() {
    super.onAssistantClick()
    playAssistantAudio(R.string.audio_otp_prompt)
  }

  /** Handler called when full OTP is entered */
  private fun handleOTPReady() {
    otpEt.isEnabled = false
    verifyOTP(otpEt.text.toString())
  }

  /** Handler called when OTP is not full length. Clear error message and check box */
  private fun handleOTPNotReady() {
    invalidOTPTv.visibility = View.INVISIBLE
    otpStatusIv.setImageResource(0)
    otpStatusIv.setImageResource(R.drawable.ic_check_grey)
  }

  /**
   * Verify if the user has entered a valid OTP. If so, move to the next activity. Else, show the
   * invalid OTP message and enable the text box.
   */
  private fun verifyOTP(otp: String) {
    if (otp == WorkerInformation.otp) {
      otpStatusIv.setImageResource(0)
      otpStatusIv.setImageResource(R.drawable.ic_check)
      invalidOTPTv.visibility = View.INVISIBLE
      startActivity(Intent(applicationContext, ProfilePictureActivity::class.java))
    } else {
      invalidOTPTv.visibility = View.VISIBLE
      otpStatusIv.setImageResource(0)
      otpStatusIv.setImageResource(R.drawable.ic_quit_select)
      otpEt.isEnabled = true
      requestSoftKeyFocus(otpEt)
    }
  }

  /** Resend OTP */
  private fun resendOTP() {
    resendOTPBtn.visibility = View.GONE
    ioScope.launch {
      val worker = JsonObject()
      worker.addProperty("creation_code", WorkerInformation.creation_code)
      worker.addProperty("phone_number", WorkerInformation.phone_number)
      karyaAPI.resendOTP(worker)
    }
  }
}
