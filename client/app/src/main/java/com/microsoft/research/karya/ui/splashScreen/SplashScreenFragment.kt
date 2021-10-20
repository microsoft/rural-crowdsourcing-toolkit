// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.NavController
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SplashScreenFragment : Fragment(R.layout.fragment_splash_screen) {

  private val viewModel by viewModels<SplashViewModel>()
  private lateinit var navController: NavController

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    navController = findNavController()
    handleNavigation()
    observeEffects()

    viewModel.navigate()
  }

  private fun handleNavigation() {
    viewModel.splashDestination.observe(viewLifecycle, viewLifecycleScope) { destination ->
      when (destination) {
        Destination.AccessCodeFlow -> navigateToAccessCodeFlow()
        Destination.UserSelection -> navigateToUserSelection()
        Destination.LoginFlow -> navigateToLoginFlow()
        Destination.Dashboard -> navigateToDashboard()
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

  private fun navigateToDashboard() {
    navController.navigate(R.id.action_global_dashboardActivity)
  }

  private fun navigateToLoginFlow() {
    navController.navigate(R.id.action_splashScreenFragment_to_loginFlow)
  }
}
