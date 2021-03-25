// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Activity to fetch file resources for the selected app language.
 */

package com.microsoft.research.karya.ui.selectAppLanguage

import android.content.Intent
import com.microsoft.research.karya.R.string
import com.microsoft.research.karya.ui.base.NetworkActivity
import com.microsoft.research.karya.ui.consentForm.ConsentFormActivity
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.ui.skillSpecification.SkillSpecification
import com.microsoft.research.karya.utils.AppConstants
import com.microsoft.research.karya.utils.FileUtils
import kotlinx.coroutines.launch
import java.io.File

class FetchFileResourcesForAppLanguage : NetworkActivity(
    indeterminateProgress = true,
    noMessage = false,
    allowRetry = false
) {
    override suspend fun getStringsForActivity() {
        networkRequestMessage = getValueFromName(string.fetching_values_for_language)
    }

    /**
     * Check if the app language has a values file attached to it. If so, download the file.
     * Otherwise, skip this step.
     */
    override suspend fun executeRequest() {
        val appLanguageId = WorkerInformation.app_language!!
        val language = karyaDb.languageDao().getById(appLanguageId)

        if (language.lrv_file_id != null) {
            val filePath = getBlobPath(KaryaFileContainer.L_LRVS, language.id.toString())

            if (!File(filePath).exists()) {
                val languageResourceFileResponse =
                    karyaAPI.getFileLanguageResourceValuesByLanguageId(language.id)
                if (languageResourceFileResponse.isSuccessful) {
                    FileUtils.downloadFileToLocalPath(languageResourceFileResponse, filePath)
                }
            }

            /** Extract the tar ball into the lang-res folder */
            if (File(filePath).exists()) {
                val langResDir = getContainerDirectory(KaryaFileContainer.LANG_RES)
                FileUtils.extractTarBallIntoDirectory(filePath, langResDir)
            }
        }
    }

    /**
     * If the activity is from the dashboard, check if the user has skill in the new app language.
     * If not, route to the skill specification screen for the new language. Else just finish().
     * If not fromDashboard, move to creation code activity.
     */
    override fun startNextActivity() {
        val selectAppLanguageFrom = intent.getIntExtra(AppConstants.SELECT_APP_LANGUAGE_CALLER, 0)
        if (selectAppLanguageFrom == AppConstants.DASHBOARD) {
            ioScope.launch {
                val skillRecord =
                    karyaDb.workerLanguageSkillDaoExtra().getSkillsForLanguage(
                        WorkerInformation.app_language!!
                    )
                uiScope.launch {
                    if (skillRecord == null) {
                        val nextIntent = Intent(applicationContext, SkillSpecification::class.java)
                        nextIntent.putExtra(
                            AppConstants.LANGUAGE_ID_FOR_SKILLS,
                            WorkerInformation.app_language!!
                        )
                        nextIntent.putExtra(
                            AppConstants.SKILL_SPECIFICATION_CALLER,
                            AppConstants.FETCH_FILE_FOR_APP_LANGUAGE
                        )
                        startActivity(nextIntent)
                    }
                    finish()
                }
            }
        } else {
            startActivity(Intent(applicationContext, ConsentFormActivity::class.java))
        }
    }
}
