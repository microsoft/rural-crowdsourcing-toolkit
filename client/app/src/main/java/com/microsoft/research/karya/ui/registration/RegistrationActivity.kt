package com.microsoft.research.karya.ui.registration

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.TypedValue
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import kotlinx.android.synthetic.main.fragment_creation_code.*
import kotlinx.coroutines.launch

private const val CREATION_CODE_LENGTH = 16

class RegistrationActivity : BaseActivity(useAssistant = true) {
    /** Compute creation code text box length based on the creation code length */

    /** Android strings */
    private var accessCodePromptMessage: String = ""
    private var invalidCreationCodeMessage: String = ""
    private var creationCodeAlreadyUsedMessage: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_registration)

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
}
