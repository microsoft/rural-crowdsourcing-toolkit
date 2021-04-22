// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This activity fetches all core data from the server. Core data includes all records from the
 * language table, scenario table, language resource table, and the language resource value table.
 * As the activity is executed before the user chooses any language, it cannot display any text
 * messages. We can perhaps look into having images that can mark absence of network connection.
 */

package com.microsoft.research.karya.ui.fetchData

import android.content.Intent
import com.microsoft.research.karya.data.model.karya.LanguageResourceType
import com.microsoft.research.karya.ui.base.NetworkActivity
import com.microsoft.research.karya.ui.accesscode.AccessCodeActivity
import com.microsoft.research.karya.utils.AppConstants
import com.microsoft.research.karya.utils.FileUtils
import kotlinx.android.synthetic.main.activity_network_activity.*
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import okhttp3.ResponseBody
import retrofit2.Response
import java.io.File

class FirstLoadFetchData : NetworkActivity(
    indeterminateProgress = false,
    noMessage = true,
    allowRetry = false
) {

    enum class FetchDataState {
        FETCH_START,
        SENT_LANGUAGE_REQUEST,
        SENT_SCENARIO_REQUEST,
        SENT_LANGUAGE_RESOURCE_REQUEST,
        SENT_LANGUAGE_RESOURCE_VALUE_REQUEST,
        RECEIVED_LANGUAGES,
        RECEIVED_SCENARIOS,
        RECEIVED_LANGUAGE_RESOURCES,
        RECEIVED_LANGUAGE_RESOURCE_VALUES,
        SENT_FILE_LANGUAGE_RESOURCE_REQUEST,
        RECEIVED_FILE_LANGUAGE_RESOURCES,
        FETCH_END
    }

    /**
     * This activity is run before the user has fetched any language. Therefore, it is not possible
     * to display any message or error.
     */
    override suspend fun getStringsForActivity() = Unit

    /**
     * Set the initial UI strings
     */
    override suspend fun setInitialUIStrings() = Unit

    /**
     * Execute the network requests to fetch the data. Update the UI on successful requests.
     */
    override suspend fun executeRequest() {
        /** Set initial state for the progress bar */
        uiScope.launch {
            networkRequestPb.max = FetchDataState.FETCH_END.ordinal
            updateActivityProgress(FetchDataState.FETCH_START)
        }

        /** Get all the languages */
        val languagesResponseDeferred = ioScope.async { karyaAPI.getLanguages() }
        updateActivityProgress(FetchDataState.SENT_LANGUAGE_REQUEST)

        /** Get all the scenarios */
        val scenariosResponseDeferred = ioScope.async { karyaAPI.getScenarios() }
        updateActivityProgress(FetchDataState.SENT_SCENARIO_REQUEST)

        /** Get all the language resources */
        val lrResponseDeferred = ioScope.async { karyaAPI.getLanguageResources() }
        updateActivityProgress(FetchDataState.SENT_LANGUAGE_RESOURCE_REQUEST)

        /** Get all the language resource values */
        val lrvResponseDeferred = ioScope.async { karyaAPI.getLanguageResourceValues() }
        updateActivityProgress(FetchDataState.SENT_LANGUAGE_RESOURCE_VALUE_REQUEST)

        val languagesResponse = languagesResponseDeferred.await()
        updateActivityProgress(FetchDataState.RECEIVED_LANGUAGES)

        val scenariosResponse = scenariosResponseDeferred.await()
        updateActivityProgress(FetchDataState.RECEIVED_SCENARIOS)

        val lrResponse = lrResponseDeferred.await()
        updateActivityProgress(FetchDataState.RECEIVED_LANGUAGE_RESOURCES)

        val lrvResponse = lrvResponseDeferred.await()
        updateActivityProgress(FetchDataState.RECEIVED_LANGUAGE_RESOURCE_VALUES)

        /** If any of the calls have failed, then call error */
        if (!languagesResponse.isSuccessful ||
            !scenariosResponse.isSuccessful ||
            !lrResponse.isSuccessful ||
            !lrvResponse.isSuccessful) {
            networkErrorMessage = ""
            networkRetryMessage = ""
            throw Exception("no_internet")
        }

        /** Gather all the data */
        val languages = languagesResponse.body()!!
        val scenarios = scenariosResponse.body()!!
        val languageResourceValues = lrvResponse.body()!!

        /** Gather and sort language resources */
        val languageResources = lrResponse.body()!!.sortedWith(Comparator { r1, r2 ->
            when {
                r1.type == LanguageResourceType.string_resource -> -1
                r2.type == LanguageResourceType.file_resource -> -1
                else -> 1
            }
        })

        /** Upsert all of them into the local db */
        karyaDb.languageDao().upsert(languages)
        karyaDb.scenarioDao().upsert(scenarios)
        karyaDb.languageResourceDao().upsert(languageResources)
        karyaDb.languageResourceValueDao().upsert(languageResourceValues)

        /** Get all list file resources */
        val listResources = karyaDb.languageResourceDaoExtra().getListFileResources()
        val listFileRequests: MutableList<Deferred<Response<ResponseBody>>?> = mutableListOf()

        for (resId in listResources) {
            val filePath = getBlobPath(KaryaFileContainer.LR_LRVS, resId.toString())
            if (!File(filePath).exists()) {
                val requestDeferred = ioScope.async {
                    karyaAPI.getFileLanguageResourceValuesByLanguageResourceId(resId)
                }
                listFileRequests.add(requestDeferred)
            } else {
                listFileRequests.add(null)
            }
        }
        updateActivityProgress(FetchDataState.SENT_FILE_LANGUAGE_RESOURCE_REQUEST)

        val langResDir = getContainerDirectory(KaryaFileContainer.LANG_RES)
        for ((resId, deferredRequest) in listResources zip listFileRequests) {
            val filePath = getBlobPath(KaryaFileContainer.LR_LRVS, resId.toString())

            // Download file if request was sent
            if (deferredRequest != null) {
                val response = deferredRequest.await()
                if (response.isSuccessful) {
                    FileUtils.downloadFileToLocalPath(response, filePath)
                }
            }

            if (File(filePath).exists()) {
                FileUtils.extractTarBallIntoDirectory(filePath, langResDir)
            }
        }
        updateActivityProgress(FetchDataState.RECEIVED_FILE_LANGUAGE_RESOURCES)
        updateActivityProgress(FetchDataState.FETCH_END)
    }

    /**
     * Start the select app language activity
     */
    override fun startNextActivity() {
        val nextIntent = Intent(applicationContext, AccessCodeActivity::class.java)
        nextIntent.putExtra(
            AppConstants.SELECT_APP_LANGUAGE_CALLER,
            AppConstants.FETCH_DATA_ON_INIT
        )
        startActivity(nextIntent)
    }

    /**
     * Override the function to set error message. This activity cannot display any message as it is
     * run before the user selects a language.
     */
    override fun setErrorMessage() {
        finish()
    }

    /**
     * Update the progress of the activity
     */
    private fun updateActivityProgress(state: FetchDataState) = uiScope.launch {
        networkRequestPb.progress = state.ordinal
    }
}
