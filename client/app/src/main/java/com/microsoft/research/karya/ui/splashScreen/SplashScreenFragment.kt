package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import android.view.View
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSplashScreenBinding
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.viewBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@AndroidEntryPoint
class SplashScreenFragment : Fragment(R.layout.fragment_splash_screen) {

    private val binding by viewBinding(FragmentSplashScreenBinding::bind)
    private val viewModel by hiltNavGraphViewModels<SplashViewModel>(R.navigation.splash)
    private lateinit var navController: NavController

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        navController = findNavController()
        binding.progressBar.isIndeterminate = true

        lifecycleScope.launch {
            val isFirstRun = isFirstRun()
            if (isFirstRun) {
                navigateToAccessCodeScreen()
                return@launch
            }

            val loggedInUsers = getLoggedInUsers()

            when (loggedInUsers) {
                0 -> navigateToAccessCodeScreen()
                1 -> navigateToUserAuthScreen()
                else -> navigateToUserSelectScreen()
            }
        }
    }

    private fun navigateToUserSelectScreen() {
        // navController.navigate(R.id.action_splashScreenFragment_to_userSelectionFlow)
        requireActivity().finish()
    }

    private fun navigateToUserAuthScreen() {
        navController.navigate(R.id.action_splashScreenFragment_to_registration_navigation)
        requireActivity().finish()
    }

    private fun navigateToAccessCodeScreen() {
        navController.navigate(R.id.action_splashScreenFragment_to_access_code_nav_graph)
        requireActivity().finish()
    }

    private fun navigateToDashboardScreen() {
        navController.navigate(R.id.action_splashScreenFragment_to_ngDashboardActivity)
        requireActivity().finish()
    }

    private suspend fun getLoggedInUsers(): Int {
        val workers = viewModel.getLoggedInUsers()

        return workers.size
    }

    private suspend fun isFirstRun(): Boolean = withContext(Dispatchers.IO) {
        val firstRunKey = booleanPreferencesKey(PreferenceKeys.IS_FIRST_RUN)
        val data = requireContext().dataStore.data.first()

        return@withContext data[firstRunKey] ?: true
    }
}
