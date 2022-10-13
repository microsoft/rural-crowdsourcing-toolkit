// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.NavController
import androidx.navigation.fragment.findNavController
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.AppUpdateType.IMMEDIATE
import com.google.android.play.core.install.model.UpdateAvailability
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SplashScreenFragment : Fragment(R.layout.fragment_splash_screen) {

  private val UPDATE_REQUEST_CODE = 1

  private val viewModel by viewModels<SplashViewModel>()
  private lateinit var navController: NavController
  private lateinit var appUpdateManager: AppUpdateManager

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    checkUpdates()
  }

  private fun checkUpdates() {
    appUpdateManager = AppUpdateManagerFactory.create(requireContext())

// Returns an intent object that you use to check for an update.
    val appUpdateInfoTask = appUpdateManager.appUpdateInfo

// Checks that the platform will allow the specified type of update.
    appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
      if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
      ) {
        appUpdateManager.startUpdateFlowForResult(
          // Pass the intent that is returned by 'getAppUpdateInfo()'.
          appUpdateInfo,
          // Or 'AppUpdateType.FLEXIBLE' for flexible updates.
          AppUpdateType.IMMEDIATE,
          // The current activity making the update request.
          requireActivity(),
          // Include a request code to later monitor this update request.
          UPDATE_REQUEST_CODE)
      } else {
        // If no updates available proceed
        setupSplashScreen()
      }
    }

  }

  private fun setupSplashScreen() {
    navController = findNavController()
    handleNavigation()
    observeEffects()

    viewModel.navigate()
  }

  // Checks that the update is not stalled during 'onResume()'.
  // However, you should execute this check at all entry points into the app.
  override fun onResume() {
    super.onResume()

    appUpdateManager
      .appUpdateInfo
      .addOnSuccessListener { appUpdateInfo ->
        if (appUpdateInfo.updateAvailability()
          == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
        ) {
          // If an in-app update is already running, resume the update.
          appUpdateManager.startUpdateFlowForResult(
            appUpdateInfo,
            IMMEDIATE,
            requireActivity(),
            UPDATE_REQUEST_CODE
          )
        }
      }
  }



  private fun handleNavigation() {
    viewModel.splashDestination.observe(viewLifecycle, viewLifecycleScope) { destination ->
      when (destination) {
        Destination.AccessCodeFlow -> navigateToAccessCodeFlow()
        Destination.UserSelection -> navigateToUserSelection()
        Destination.LoginFlow -> navigateToLoginFlow()
        Destination.HomeScreen -> navigateToHomeScreen()
        Destination.ProfileFragment -> navigateToProfileFragment()
        Destination.Splash -> {
        }
      }
    }
  }

  private fun observeEffects() {
    viewModel.splashEffects.observe(viewLifecycle, viewLifecycleScope) { effect ->
      when (effect) {
        is SplashEffects.UpdateLanguage -> updateActivityLanguage(effect.language)
      }
    }
  }

  private fun updateActivityLanguage(language: String) {
    (requireActivity() as MainActivity).setActivityLocale(language)
  }

  private fun navigateToUserSelection() {
    // navController.navigate(R.id.action_splashScreenFragment_to_userSelectionFlow)
  }

  private fun navigateToAccessCodeFlow() {
    navController.navigate(R.id.action_splashScreenFragment_to_accessCodeFragment)
  }

  private fun navigateToHomeScreen() {
    navController.navigate(R.id.action_splashScreen_to_homeScreen)
  }

  private fun navigateToLoginFlow() {
    navController.navigate(R.id.action_splashScreenFragment_to_loginFlow)
  }

  private fun navigateToProfileFragment() {
    navController.navigate(R.id.action_splashScreenFragment_to_profileFragment)
  }
}
