package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.microsoft.research.karya.databinding.SplashScreenBinding
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.viewBinding
import dataStore
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.map

class SplashScreenFragment : Fragment() {

    private val binding by viewBinding(SplashScreenBinding::bind)

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        lifecycleScope.launchWhenResumed {
            val isFirstRun = isFirstRun()
            if (isFirstRun) {
                navigateToCreationCodeScreen()
                return@launchWhenResumed
            }

            val loggedInUsers = getLoggedInUsers()
            when (loggedInUsers) {
                0 -> navigateToCreationCodeScreen()
                1 -> navigateToUserAuthScreen()
                else -> navigateToUserSelectScreen()
            }
            return@launchWhenResumed
        }
    }

    fun navigateToUserSelectScreen() {

    }

    fun navigateToUserAuthScreen() {

    }

    fun navigateToCreationCodeScreen() {

    }

    suspend fun getLoggedInUsers(): Int {
        // TODO: Get users from viewmodel
        return 0
    }

    private suspend fun isFirstRun(): Boolean {
        var firstRunBoolean = false
        val firstRunKey = booleanPreferencesKey(PreferenceKeys.IS_FIRST_RUN)

        requireContext().dataStore.data.map { preferences ->
            preferences[firstRunKey] ?: false
        }.collect {
            firstRunBoolean = it
        }

        return firstRunBoolean
    }
}
