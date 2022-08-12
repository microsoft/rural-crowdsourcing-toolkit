package com.microsoft.research.karya.ui.onboarding.login.profile

import android.os.Bundle
import android.view.View
import androidx.core.widget.doOnTextChanged
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

    with(binding) {
      // On submit, send profile data
      submitProfileBtn.setOnClickListener {
        setProfileData()
        viewModel.handleNextClick()
      }

      // back to home
      backToHomeScreen.setOnClickListener {
        findNavController().popBackStack()
      }

      // On input change, check if submit should be enabled
      binding.nameInputEt.doOnTextChanged { text, start, count, after ->
        updateSubmitState()
      }

      binding.genderRg.addOnButtonCheckedListener { _, _, _ ->
        updateSubmitState()
      }

      binding.yobInputEt.doOnTextChanged { text, start, count, after ->
        updateSubmitState()
      }
    }
  }

  private fun setProfileData() {
    viewModel.profileData = ProfileData(
        binding.nameInputEt.text.toString(),
        when (binding.genderRg.checkedButtonId) {
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
        is ProfileUiState.Error -> showErrorUi(getErrorMessage(state.throwable))
        is ProfileUiState.Empty -> showEmptyUi()
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
    updateSubmitState()
    hideLoading()
    enableInputFields()
  }

  private fun showEmptyUi() {
    binding.backToHomeScreen.gone()
    hideLoading()
    enableInputFields()
  }

  private fun showLoadingUi() {
    disableInputFields()
    showLoading()
    disableInputFields()
  }

  private fun showSuccessUi() {
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

  private fun updateSubmitState() {
    with(binding) {
      val nameEmpty = nameInputEt.text.isNullOrEmpty()
      val noGender = genderRg.checkedButtonId == -1
      val yobEmpty = yobInputEt.text.isNullOrEmpty()
      if (nameEmpty || noGender || yobEmpty) {
        disableSubmit()
      } else {
        enableSubmit()
      }
    }
  }

  private fun enableSubmit() {
    binding.submitProfileBtn.apply {
      enable()
      isClickable = true
    }
  }

  private fun disableSubmit() {
    binding.submitProfileBtn.apply {
      disable()
      isClickable = false
    }
  }
}
