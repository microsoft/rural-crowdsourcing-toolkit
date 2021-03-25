// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This activity displays the end-user consent form for the application. The user can proceed
 * further in the application only after they agree to the form.
 */

package com.microsoft.research.karya.ui.consentForm

import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.ScrollingMovementMethod
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.ui.registration.CreationCodeActivity
import kotlinx.android.synthetic.main.activity_consent_form.*
import kotlinx.coroutines.launch

class ConsentFormActivity : BaseActivity(useAssistant = true) {

    /** UI Strings */
    private lateinit var agreeText: String
    private lateinit var disagreeText: String
    private lateinit var consentFormText: String

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_consent_form)
        super.onCreate(savedInstanceState)

        /** Set click listeners */
        agreeBtn.setOnClickListener { onAgreeButtonClick() }
        disagreeBtn.setOnClickListener { onDisagreeButtonClick() }
    }

    /**
     * Function to get all string values needed for the activity
     */
    override suspend fun getStringsForActivity() {
        agreeText = getValueFromName(R.string.consent_form_agree)
        disagreeText = getValueFromName(R.string.consent_form_disagree)
        consentFormText = getValueFromName(R.string.consent_form_text)
    }

    /**
     * Function to set the initial UI elements for the activity
     */
    override suspend fun setInitialUIStrings() {
        agreeBtn.text = agreeText
        disagreeBtn.text = disagreeText
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            consentFormTv.text = Html.fromHtml(consentFormText, Html.FROM_HTML_MODE_COMPACT)
        } else {
            consentFormTv.text = Html.fromHtml(consentFormText)
        }
        consentFormTv.movementMethod = ScrollingMovementMethod()
    }

    /**
     * On assistant click, play the summary of the consent form
     */
    override fun onAssistantClick() {
        super.onAssistantClick()
        playAssistantAudio(R.string.audio_consent_form_summary, onCompletionListener = {
            uiScope.launch {
                agreeBtn.isEnabled = true
                agreeBtn.setTextColor(Color.parseColor("#FFFFFF"))
                disagreeBtn.isEnabled = true
            }
        })
    }

    /**
     * Handler for disagree button click. On disagree, finish()
     */
    private fun onDisagreeButtonClick() {
        finish()
    }

    /**
     * Handler for agree button click. On agree, move to creation code activity
     */
    private fun onAgreeButtonClick() {
        startActivity(Intent(applicationContext, CreationCodeActivity::class.java))
    }
}
