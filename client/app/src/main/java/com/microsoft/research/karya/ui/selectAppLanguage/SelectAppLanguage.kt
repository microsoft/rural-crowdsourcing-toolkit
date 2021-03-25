// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.selectAppLanguage

import android.content.Intent
import android.os.Bundle
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.utils.AppConstants
import java.util.Timer
import kotlin.concurrent.scheduleAtFixedRate
import kotlinx.android.synthetic.main.activity_select_app_language.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

class SelectAppLanguage : BaseActivity(
    useAssistant = true,
    playAssistantOnResume = false
), SupportedLanguageClickListener {

    /** Local state */
    private lateinit var supportedLanguageAdapter: SupportedLanguageListAdapter
    private lateinit var supportedLanguages: MutableList<SupportedLanguage>
    private var fromActivity = 0

    private var assistantTimer: Timer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_select_app_language)
        super.onCreate(savedInstanceState)

        /** Get the activity from which this is called */
        fromActivity = intent.getIntExtra(AppConstants.SELECT_APP_LANGUAGE_CALLER, 0)

        /** Set the adapter for supported languages */
        supportedLanguageAdapter = SupportedLanguageListAdapter(this, this)
        supportedLanguagesRv.adapter = supportedLanguageAdapter
    }

    override suspend fun getStringsForActivity() = Unit
    override suspend fun setInitialUIStrings() = Unit

    /**
     * On resume, update supported languages
     */
    override fun onResume() {
        super.onResume()

        /** If called for the first time, update supported languages */
        if (!::supportedLanguages.isInitialized) {
            runBlocking {
                getSupportedLanguages().join()
                updateSupportedLanguages()
            }
        }

        /** Call assistant */
        uiScope.launch {
            delay(1000)
            // onAssistantClick()
        }
    }

    /**
     * On assistant click, loop through all the languages and play the audio prompt
     */
    override fun onAssistantClick() {
        super.onAssistantClick()
        if (supportedLanguages.size > 1) {
            resetAssistant()
            playPromptForLanguage(0)
        }
    }

    /**
     * Play audio for a specific language (specified using the index in the supported language list)
     */
    private fun playPromptForLanguage(index: Int) {
        uiScope.launch {
            val languageId = supportedLanguages[index].id
            playAssistantAudio(
                R.string.audio_prompt_for_language_select,
                languageId,
                uiCue = {
                    blinkPointer(index)
                },
                onCompletionListener = {
                    playNext(index)
                })
        }
    }

    /**
     * Chaining function to play the next prompt
     */
    private fun playNext(index: Int) {
        uiScope.launch {
            delay(1000)
            assistantTimer?.cancel()
            assistantTimer = null
            setPointer(index, false)
            if (index != supportedLanguages.lastIndex)
                playPromptForLanguage(index + 1)
        }
    }

    /**
     * Blink the cursor pointer on a specific language
     */
    private fun blinkPointer(index: Int) {
        assistantTimer = Timer("assistant", true)
        assistantTimer!!.scheduleAtFixedRate(0, 400) {
            uiScope.launch {
                setPointer(index, !supportedLanguages[index].showPointer)
            }
        }
    }

    /**
     * Set pointer state for a particular language
     */
    private fun setPointer(index: Int, state: Boolean) {
        supportedLanguages[index].showPointer = state
        supportedLanguageAdapter.notifyItemChanged(index)
    }

    /**
     * Reset assistant timer and animations
     */
    private fun resetAssistant() {
        assistantTimer?.cancel()
        for (i in 0 until supportedLanguages.size) {
            setPointer(i, false)
        }
    }

    /**
     * Get the list of supported languages
     */
    private fun getSupportedLanguages() = ioScope.launch {
        val showAppInLanguageLR = getString(R.string.show_app_in_language)
        val showAppPrompts =
            karyaDb.languageResourceValueDaoExtra().getValuesFromName(showAppInLanguageLR)
        val languageRecords = karyaDb.languageDaoExtra().getStringSupported()

        var supportedLanguageRecords = languageRecords

        supportedLanguages = mutableListOf()
        for (l in supportedLanguageRecords) {
            val prompt = showAppPrompts.find { it.language_id == l.id }!!.value
            supportedLanguages.add(
                SupportedLanguage(
                    l.id,
                    l.primary_language_name,
                    prompt,
                    false
                )
            )
        }
    }

    /**
     * Update supported languages
     */
    private fun updateSupportedLanguages() {
        uiScope.launch {
            when (supportedLanguages.size) {
                1 -> onLanguageSelected(supportedLanguages[0])
                0 -> finish()
                else  -> supportedLanguageAdapter.setList(supportedLanguages)
            }
        }
    }

    /**
     * On pause, cancel timer. Hide all pointers
     */
    override fun onPause() {
        super.onPause()
        resetAssistant()
    }

    /**
     * Listener for supported language button click
     */
    override fun onLanguageSelected(language: SupportedLanguage) {
        // stop assistant
        stopAssistant()
        assistantTimer?.cancel()

        // Set the app language
        WorkerInformation.app_language = language.id

        /** If activity is called from the dashboard, then update worker's app ID */
        if (fromActivity == AppConstants.DASHBOARD) {
            ioScope.launch {
                karyaDb.workerDaoExtra().updateAppLanguage(language.id)
            }
        }

        fetchDataForLanguage()
    }

    /**
     * Fetch all the data for the given language.
     */
    private fun fetchDataForLanguage() {
        val nextIntent = Intent(applicationContext, FetchFileResourcesForAppLanguage::class.java)
        nextIntent.putExtra(AppConstants.SELECT_APP_LANGUAGE_CALLER, fromActivity)
        startActivity(nextIntent)
        if (fromActivity == AppConstants.DASHBOARD) finish()
    }
}
