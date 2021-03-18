// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.TypedValue
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import kotlinx.android.synthetic.main.activity_phone_number.*
import kotlinx.coroutines.launch

private const val PHONE_NUMBER_LENGTH = 10

class PhoneNumberActivity : BaseActivity(useAssistant = true) {

    /** Android strings */
    private var phoneNumberPromptMessage: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_phone_number)
        super.onCreate(savedInstanceState)

        /** Set the phone number font size to the same value as the phantom text view font size */
        phantomPhoneNumberTv.addOnLayoutChangeListener { _: View, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int ->
            phoneNumberEt.setTextSize(TypedValue.COMPLEX_UNIT_PX, phantomPhoneNumberTv.textSize)
        }

        /** Set phone number text change listener */
        phoneNumberEt.addTextChangedListener(object : TextWatcher {
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
        requestSoftKeyFocus(phoneNumberEt)

        /** Phone number next button should not be clickable by default */
        phoneNumberNextIv.setOnClickListener {
            phoneNumberNextIv.visibility = View.INVISIBLE
            handleNextClick()
        }
        phoneNumberNextIv.isClickable = false
    }

    /**
     * Get strings for this activity
     */
    override suspend fun getStringsForActivity() {
        phoneNumberPromptMessage = getValueFromName(R.string.phone_number_prompt)
    }

    /**
     * Set initial UI strings for activity
     */
    override suspend fun setInitialUIStrings() {
        phoneNumberPromptTv.text = phoneNumberPromptMessage
    }

    /**
     * On assistant click, play the phone number prompt
     */
    override fun onAssistantClick() {
        super.onAssistantClick()
        playAssistantAudio(R.string.audio_phone_number_prompt)
    }

    /** Update UI when the phone number is ready */
    private fun handlePhoneNumberReady() {
        uiScope.launch {
            phoneNumberNextIv.setImageResource(0)
            phoneNumberNextIv.setImageResource(R.drawable.ic_next_enabled)
            phoneNumberNextIv.isClickable = true
        }
    }

    /** Update UI when the phone number is ready */
    private fun handlePhoneNumberNotReady() {
        uiScope.launch {
            phoneNumberNextIv.setImageResource(0)
            phoneNumberNextIv.setImageResource(R.drawable.ic_next_disabled)
            phoneNumberNextIv.isClickable = false
        }
    }

    /** On next click, hide keyboard. Send request to send OTP to the phone number */
    private fun handleNextClick() {
        hideKeyboard()
        WorkerInformation.phone_number = phoneNumberEt.text.toString()
        startActivity(Intent(applicationContext, SendOTPActivity::class.java))
    }
}
