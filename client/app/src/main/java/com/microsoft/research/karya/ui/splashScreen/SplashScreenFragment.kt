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
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.viewBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SplashScreenFragment : Fragment(R.layout.fragment_splash_screen) {

  private val binding by viewBinding(FragmentSplashScreenBinding::bind)
  private val viewModel by hiltNavGraphViewModels<SplashViewModel>(R.id.splash)
  private lateinit var navController: NavController

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    navController = findNavController()
    binding.progressBar.isIndeterminate = true
    handleNavigation()
    viewModel.navigate()
  }

  private fun handleNavigation() {
    viewModel.splashDestination.observe(lifecycle, lifecycleScope) { destination ->
      when(destination) {
        SplashDestination.AccessCode -> handleNoUserNavigation()
        SplashDestination.Dashboard -> handleSingleUserNavigation()
        SplashDestination.Splash -> {}
        SplashDestination.UserSelection -> handleMultipleUserNavigation()
      }
    }
  }

  private fun handleMultipleUserNavigation() {
    // navController.navigate(R.id.action_splashScreenFragment_to_userSelectionFlow)
    requireActivity().finish()
  }

  private fun handleNoUserNavigation() {
    navController.navigate(R.id.action_splashScreenFragment_to_access_code_nav_graph)
    requireActivity().finish()
  }

  private fun handleSingleUserNavigation() {
    navController.navigate(R.id.action_splashScreenFragment_to_ngDashboardActivity)
    requireActivity().finish()
  }
}
