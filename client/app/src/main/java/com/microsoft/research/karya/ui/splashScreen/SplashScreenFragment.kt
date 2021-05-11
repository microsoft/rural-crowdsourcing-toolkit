package com.microsoft.research.karya.ui.splashScreen

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSplashScreenBinding
import com.microsoft.research.karya.utils.extensions.finish
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SplashScreenFragment : Fragment(R.layout.fragment_splash_screen) {

  private val binding by viewBinding(FragmentSplashScreenBinding::bind)
  private val viewModel by hiltNavGraphViewModels<SplashViewModel>(R.id.splash)
  private lateinit var navController: NavController

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    navController = findNavController()
    handleNavigation()
    viewModel.navigate()
  }

  private fun handleNavigation() {
    viewModel.splashDestination.observe(lifecycle, lifecycleScope) { destination ->
      when (destination) {
        SplashDestination.AccessCode -> navigateToAccessCode()
        SplashDestination.UserSelection -> navigateToUserSelection()
        SplashDestination.Registration -> navigateToRegistration()
        SplashDestination.Dashboard -> navigateToDashboard()
        SplashDestination.Splash -> {}
      }
    }
  }

  private fun navigateToUserSelection() {
    // navController.navigate(R.id.action_splashScreenFragment_to_userSelectionFlow)
  }

  private fun navigateToAccessCode() {
    navController.navigate(R.id.action_splashScreenFragment_to_access_code_nav_graph)
    finish()
  }

  private fun navigateToDashboard() {
    navController.navigate(R.id.action_splashScreenFragment_to_ngDashboardActivity)
    finish()
  }

  private fun navigateToRegistration() {
    navController.navigate(R.id.action_splashScreenFragment_to_registration_navigation)
    finish()
  }
}
