package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import android.view.View
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSplashScreenBinding
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.viewBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SplashScreenFragment : Fragment(R.layout.fragment_splash_screen) {

  private val binding by viewBinding(FragmentSplashScreenBinding::bind)
  private val viewModel by viewModels<SplashViewModel>()
  private lateinit var navController: NavController

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    navController = findNavController()
    binding.progressBar.isIndeterminate = true

    lifecycleScope.launch {
      val isFirstRun = isFirstRun()
      if (isFirstRun) {
        navigateToCreationCodeScreen()
        return@launch
      }

      val loggedInUsers = getLoggedInUsers()
      when (loggedInUsers) {
        0 -> navigateToCreationCodeScreen()
        1 -> navigateToUserAuthScreen()
        else -> navigateToUserSelectScreen()
      }
    }
  }

  private fun navigateToUserSelectScreen() {
    navController.navigate(R.id.action_splashScreenFragment_to_userSelectionFlow)
  }

  private fun navigateToUserAuthScreen() {
    navController.navigate(R.id.action_splashScreenFragment_to_onboardingFlow)
  }

  private fun navigateToCreationCodeScreen() {
    navController.navigate(R.id.action_splashScreenFragment_to_creationCodeFlow)
  }

  private fun navigateToDashboardScreen() {
    navController.navigate(R.id.action_splashScreenFragment_to_dashboardFlow)
  }

  private suspend fun getLoggedInUsers(): Int {
    val workers = viewModel.getLoggedInUsers()

    return workers.size
  }

  private suspend fun isFirstRun(): Boolean =
      withContext(Dispatchers.IO) {
        val firstRunKey = booleanPreferencesKey(PreferenceKeys.IS_FIRST_RUN)
        val data = requireContext().dataStore.data.first()

        return@withContext data[firstRunKey] ?: true
      }
}
