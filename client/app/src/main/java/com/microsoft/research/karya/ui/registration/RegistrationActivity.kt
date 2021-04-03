package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.util.Log
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity

class RegistrationActivity : BaseActivity(useAssistant = true) {
    /** Compute creation code text box length based on the creation code length */

    /** Android strings */
    var accessCodePromptMessage: String = ""
    var invalidCreationCodeMessage: String = ""
    var creationCodeAlreadyUsedMessage: String = ""
    var phoneNumberPromptMessage: String = ""

    var current_assistant_audio = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_registration)

    }

    /**
     * On assistant click, play the access code prompt
     */
    override fun onAssistantClick() {
        super.onAssistantClick()
        playAssistantAudio(current_assistant_audio)
    }

    /**
     * Get strings for this activity
     */
    override suspend fun getStringsForActivity() {
        accessCodePromptMessage = getValueFromName(R.string.access_code_prompt)
        invalidCreationCodeMessage = getValueFromName(R.string.invalid_creation_code)
        creationCodeAlreadyUsedMessage = getValueFromName(R.string.creation_code_already_used)
        phoneNumberPromptMessage = getValueFromName(R.string.phone_number_prompt)
        Log.i("STRING INIT", accessCodePromptMessage)
    }

    /**
     * Set the initial UI strings
     */
    override suspend fun setInitialUIStrings() {
        // TODO: 1) Create a Base Fragment class with this method.
        //  2) Make the fragment implement the base class
        //  3) Call the Fragment's method form here

        // For now we have a workaround of doing this task in individual Fragment's OnViewCreated
    }
}
