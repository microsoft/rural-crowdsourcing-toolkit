// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.registration
import android.content.Intent
import android.os.Bundle
import android.util.TypedValue
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import kotlinx.android.synthetic.main.activity_creation_code.*
import kotlinx.coroutines.launch

private const val CREATION_CODE_LENGTH = 16

class CreationCodeActivity : BaseActivity(useAssistant = true) {

    /** Compute creation code text box length based on the creation code length */
    private val creationCodeEtMax = CREATION_CODE_LENGTH + (CREATION_CODE_LENGTH - 1) / 4

    /** Android strings */
    private var accessCodePromptMessage: String = ""
    private var invalidCreationCodeMessage: String = ""
    private var creationCodeAlreadyUsedMessage: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_creation_code)
        super.onCreate(savedInstanceState)

        /** Set the creation code font size to the same value as the phantom text view font size */
        phantomCCTv.addOnLayoutChangeListener { _: View, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int ->
            creationCodeEt.setTextSize(TypedValue.COMPLEX_UNIT_PX, phantomCCTv.textSize)
        }

        /** Add text change listener to creation code */
        creationCodeEt.addTextChangedListener(object : SeparatorTextWatcher('-', 4) {
            override fun onAfterTextChanged(text: String, position: Int) {
                creationCodeEt.run {
                    setText(text)
                    setSelection(position)
                }

                /** If creation code length has reached max, call handler */
                if (creationCodeEt.length() == creationCodeEtMax) {
                    handleFullCreationCode()
                } else {
                    clearErrorMessages()
                }
            }
        })
        requestSoftKeyFocus(creationCodeEt)
    }

    /**
     * On assistant click, play the access code prompt
     */
    override fun onAssistantClick() {
        super.onAssistantClick()
        playAssistantAudio(R.string.audio_access_code_prompt)
    }

    /**
     * Get strings for this activity
     */
    override suspend fun getStringsForActivity() {
        accessCodePromptMessage = getValueFromName(R.string.access_code_prompt)
        invalidCreationCodeMessage = getValueFromName(R.string.invalid_creation_code)
        creationCodeAlreadyUsedMessage = getValueFromName(R.string.creation_code_already_used)
    }

    /**
     * Set the initial UI strings
     */
    override suspend fun setInitialUIStrings() {
        creationCodePromptTv.text = accessCodePromptMessage
    }

    /**
     * Handle full creation code entry by the user. Currently will automatically check if the
     * creation code is valid by sending a request to the server
     */
    private fun handleFullCreationCode() {
        creationCodeEt.isEnabled = false
        val creationCode = creationCodeEt.text.toString().replace("-", "")
        verifyCreationCode(creationCode)
    }

    private fun clearErrorMessages() {
        creationCodeErrorTv.text = ""
        creationCodeStatusIv.setImageResource(0)
        creationCodeStatusIv.setImageResource(R.drawable.ic_check_grey)
    }

    /**
     * Verify creation code. Send request to server. If successful, then move to the next activity.
     * Else set the error message appropriately.
     */
    private fun verifyCreationCode(creationCode: String) {
        ioScope.launch {
            val callForCreationCodeCheck = karyaAPI.checkCreationCode(creationCode)
            if (callForCreationCodeCheck.isSuccessful) {
                val response = callForCreationCodeCheck.body()!!

                // Valid creation code
                if (response.valid) {
                    uiScope.launch {
                        creationCodeStatusIv.setImageResource(0)
                        creationCodeStatusIv.setImageResource(R.drawable.ic_baseline_check_circle_outline_24)
                        WorkerInformation.creation_code = creationCode
                        startActivity(Intent(applicationContext, PhoneNumberActivity::class.java))
                    }
                } else {
                    uiScope.launch {
                        creationCodeErrorTv.text = when (response.message) {
                            "invalid_creation_code" -> invalidCreationCodeMessage
                            "creation_code_already_used" -> creationCodeAlreadyUsedMessage
                            else -> "unknown error occurred"
                        }
                        creationCodeStatusIv.setImageResource(0)
                        creationCodeStatusIv.setImageResource(R.drawable.ic_quit_select)
                        creationCodeEt.isEnabled = true
                        requestSoftKeyFocus(creationCodeEt)
                    }
                }
            }
        }
    }
}
