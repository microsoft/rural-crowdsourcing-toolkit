package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.util.Log
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class RegistrationActivity : BaseActivity() {
    /** Compute creation code text box length based on the creation code length */


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
    }

    /**
     * Set the initial UI strings
     */
    override suspend fun setInitialUIStrings() {
        // Nothing here, since we are setting the UI strings in resources
    }
}
