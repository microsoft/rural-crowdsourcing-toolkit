package com.microsoft.research.karya.ui.onboarding.profile

import android.graphics.BitmapFactory
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentProfilePictureBinding
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ProfileFragment : BaseFragment(R.layout.fragment_profile_picture) {

  private val binding by viewBinding(FragmentProfilePictureBinding::bind)
  private val viewModel by viewModels<ProfileViewModel>()

  private val selectPicture =
    registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
      if (bitmap == null) return@registerForActivityResult

      viewModel.saveProfileImage(bitmap)
    }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupView()
    observeUi()
    observeEffects()

    // registrationActivity.current_assistant_audio = R.string.audio_profile_picture_prompt
    // disableRotateButton()
  }

  override fun onResume() {
    super.onResume()
    assistant.playAssistantAudio(AssistantAudio.PROFILE_PICTURE_PROMPT)
  }

  private fun setupView() {
    with(binding) {
      mainProfilePictureIv.setOnClickListener { selectPicture.launch(null) }

      profilePictureNextIv.setOnClickListener { viewModel.saveProfileData("") }

      rotateRightIb.setOnClickListener { viewModel.rotateProfileImage() }

      appTb.setTitle(getString(R.string.s_profile_pic_title))
      appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.PROFILE_PICTURE_PROMPT) }
    }
  }

  private fun observeUi() {
    viewModel.profileUiState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      when (state) {
        is ProfileUiState.Success -> showSuccessUi(state.data)
        is ProfileUiState.Error -> showErrorUi(state.throwable.message!!)
        ProfileUiState.Initial -> showInitialUi()
        ProfileUiState.Loading -> showLoadingUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.profileEffects.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { effect ->
      when (effect) {
        is ProfileEffects.Navigate -> handleNavigation(effect.destination)
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      hideLoading()
      rotateRightIb.gone()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      showLoading()
      rotateRightIb.gone()
    }
  }

  private fun showSuccessUi(bitmapPath: String?) {
    with(binding) {
      hideLoading()
      rotateRightIb.visible()
      enableRotateButton()

      if (!bitmapPath.isNullOrEmpty()) {
        val bitmap = BitmapFactory.decodeFile(bitmapPath)
        mainProfilePictureIv.setImageBitmap(bitmap)
      }
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      hideLoading()
      rotateRightIb.gone()
      disableRotateButton()
    }
  }

  private fun handleNavigation(destination: Destination) {
    when (destination) {
      Destination.MandatoryDataFlow -> navigateToSelectGenderFragment()
      Destination.Dashboard -> navigateToDashboard()
    }
  }

  private fun navigateToSelectGenderFragment() {
    findNavController().navigate(R.id.action_profileFragment_to_mandatoryDataFlow)
  }

  private fun navigateToDashboard() {
    findNavController().navigate(R.id.action_global_dashboardActivity4)
  }

  private fun disableRotateButton() {
    binding.rotateRightIb.visibility = View.INVISIBLE
  }

  private fun enableRotateButton() {
    binding.rotateRightIb.visibility = View.VISIBLE
    binding.rotateRightIb.isClickable = true
  }

  private fun showLoading() {
    with(binding) {
      binding.loadingPb.visible()
      binding.profilePictureNextIv.gone()
    }
  }

  private fun hideLoading() {
    with(binding) {
      binding.loadingPb.gone()
      binding.profilePictureNextIv.visible()
    }
  }
}
