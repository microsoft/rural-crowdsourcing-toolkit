// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This activity checks if a user has already been registered with the application and if the user
 * has registered their skills for the app language. Depending on the state, it redirects to the
 * dashboard, or skill selection, or the registration process.
 */

package com.microsoft.research.karya.ui.splashScreen

import android.content.Intent
import android.os.Bundle
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.ui.dashboard.DashboardActivity
import com.microsoft.research.karya.ui.fetchData.FirstLoadFetchData
import com.microsoft.research.karya.ui.skillSpecification.SkillSpecification
import com.microsoft.research.karya.utils.AppConstants
import kotlinx.android.synthetic.main.splash_screen.*
import kotlinx.coroutines.launch

class SplashScreen : BaseActivity() {

    /** Splash screen progress state */
    enum class SplashScreenState {
        SPLASH_START,
        CHECKED_WORKER_RECORD,
        CHECKED_APP_LANGUAGE_SKILL_RECORD,
        SPLASH_END
    }

    /**
     * On create, set the content view and db. The splash screen just shows a progress bar. The user
     * has not yet chosen any application language. Therefore, it may be wise not to show any text
     * in this particular view.
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.splash_screen)
        super.onCreate(savedInstanceState)

        /** Set the initial state of the progress bar */
        splashScreenPb.max = SplashScreenState.SPLASH_END.ordinal
        updateSplashScreenProgress(SplashScreenState.SPLASH_START)
    }

    override suspend fun getStringsForActivity() = Unit
    override suspend fun setInitialUIStrings() = Unit

    /**
     * On resume, request for all permissions.
     */
    override fun onResume() {
        super.onResume()
        checkWorkerState()
    }

    /**
     * Check the current worker state and redirect to the appropriate activity
     */
    private fun checkWorkerState() {

        ioScope.launch {
            /** Get all workers from the database */
            val workers = karyaDb.workerDao().getAll()
            updateSplashScreenProgress(SplashScreenState.CHECKED_WORKER_RECORD)

            /** Get all worker language skill records from the database */
            val workerLanguageSkills = karyaDb.workerLanguageSkillDao().getAll()
            updateSplashScreenProgress(SplashScreenState.CHECKED_APP_LANGUAGE_SKILL_RECORD)

            /** Redirect based on state */

            /** If no worker, fetch data for application */
            if (workers.isEmpty()) {
                updateSplashScreenProgress(SplashScreenState.SPLASH_END)
                startActivity(Intent(applicationContext, FirstLoadFetchData::class.java))
            } else {
                val worker = workers[0]
                val appLanguageSkill =
                    workerLanguageSkills.find { it.language_id == worker.app_language }

                /** If worker has not registered skills in the app language, go to skill selection page */
                if (appLanguageSkill == null) {
                    updateSplashScreenProgress(SplashScreenState.SPLASH_END)
                    val nextIntent = Intent(applicationContext, SkillSpecification::class.java)
                    nextIntent.putExtra(AppConstants.LANGUAGE_ID_FOR_SKILLS, worker.app_language)
                    nextIntent.putExtra(
                        AppConstants.SKILL_SPECIFICATION_CALLER,
                        AppConstants.SPLASH_SCREEN
                    )
                    startActivity(nextIntent)
                } else {
                    /** Go to dashboard */
                    updateSplashScreenProgress(SplashScreenState.SPLASH_END)
                    val nextIntent = Intent(applicationContext, DashboardActivity::class.java)
                    startActivity(nextIntent)
                }
            }
        }
    }

    /**
     * Update the splash screen progress bar
     */
    private fun updateSplashScreenProgress(
        state: SplashScreenState
    ) = uiScope.launch {
        splashScreenPb.progress = state.ordinal
    }
}
