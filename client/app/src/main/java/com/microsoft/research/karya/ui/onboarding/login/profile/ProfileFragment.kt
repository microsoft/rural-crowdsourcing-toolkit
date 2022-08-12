package com.microsoft.research.karya.ui.onboarding.login.profile

import android.os.Bundle
import android.view.View
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentProfileBinding
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ProfileFragment : BaseFragment(R.layout.fragment_profile) {

  private val binding by viewBinding(FragmentProfileBinding::bind)
  private val viewModel by viewModels<ProfileViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupView()
    observeUi()
    observeEffects()
  }

  private fun setupView() {
    viewModel.getWorkerProfile()
    binding.nextBtn.setOnClickListener {
      setProfileData()
      viewModel.handleNextClick()
    }
  }

  private fun setProfileData() {
    viewModel.profileData = ProfileData(
        binding.nameInputEt.text.toString(),
        when (binding.genderRg.checkedRadioButtonId) {
          R.id.femaleRb -> Gender.FEMALE
          R.id.maleRb -> Gender.MALE
          else -> null
        },
        binding.yobInputEt.text.toString()
    )
  }

  private fun observeUi() {
    viewModel.profileUiState.observe(viewLifecycle, viewLifecycleScope) { state ->
      when (state) {
        // TODO: Change this to a correct mapping
        is ProfileUiState.Error -> showErrorUi(getErrorMessage(state.throwable))
        is ProfileUiState.Initial -> showInitialUi(state.profileData)
        is ProfileUiState.Loading -> showLoadingUi()
        is ProfileUiState.Success -> showSuccessUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.profileEffects.observe(viewLifecycle, viewLifecycleScope) { effect ->
      when (effect) {
        is ProfileEffects.Navigate -> navigate(effect.destination)
      }
    }
  }

  private fun showErrorUi(message: String) {
    showError(message)
  }

  private fun showInitialUi(profileData: ProfileData) {
    binding.nameInputEt.setText(profileData.name ?: "")
    if (profileData.gender != null) {
      binding.genderRg.check(
        if (profileData.gender == Gender.MALE)
          R.id.maleRb
        else
          R.id.femaleRb
      )
    }
    binding.yobInputEt.setText(profileData.yob)
    hideError()
    hideLoading()
    showNextButton()
    enableInputFields()
  }

  private fun showLoadingUi() {
    disableInputFields()
    hideError()
    hideNextButton()
    showLoading()
    disableInputFields()
  }

  private fun showSuccessUi() {
    hideNextButton()
    hideError()
    hideLoading()
    disableInputFields()
  }

  private fun disableInputFields() {
    binding.nameInputEt.disable()
    binding.maleRb.isClickable = false
    binding.femaleRb.isClickable = false
    binding.yobInputEt.disable()
  }

  private fun enableInputFields() {
    binding.nameInputEt.enable()
    binding.maleRb.isClickable = true
    binding.femaleRb.isClickable = true
    binding.yobInputEt.enable()
  }

  private fun hideLoading() {
    binding.loadingPb.gone()
  }

  private fun showLoading() {
    binding.loadingPb.visible()
  }

  private fun navigate(destination: Destination) {
    when (destination) {
      Destination.HomeScreen -> navigateToHomeScreen()
      else -> {}
    }
  }

  private fun navigateToHomeScreen() {
    findNavController().navigate(R.id.action_profile_to_homeScreen)
  }

  private fun showError(message: String) {
    with(binding) {
      missingFieldTv.text = message
      missingFieldTv.visible()
      hideLoading()
      showNextButton()
    }
  }

  private fun hideError() {
    binding.missingFieldTv.invisible()
  }

  private fun showNextButton() {
    binding.nextBtn.visible()
  }

  private fun hideNextButton() {
    binding.nextBtn.gone()
  }
}
