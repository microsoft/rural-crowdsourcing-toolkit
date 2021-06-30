package com.microsoft.research.karya.ui.onboarding.gender

import android.os.Bundle
import android.view.View
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentSelectGenderBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SelectGenderFragment : BaseFragment(R.layout.fragment_select_gender) {

  private val binding by viewBinding(FragmentSelectGenderBinding::bind)
  private val viewModel by viewModels<SelectGenderViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupViews()
    observeUi()
    observeEffects()
  }

  override fun onResume() {
    super.onResume()
    assistant.playAssistantAudio(AssistantAudio.GENDER_PROMPT)
  }

  private fun setupViews() {
    with(binding) {
      cvMale.setOnClickListener { viewModel.setGender(Gender.MALE) }
      cvFemale.setOnClickListener { viewModel.setGender(Gender.FEMALE) }
      cvOther.setOnClickListener { viewModel.setGender(Gender.OTHER) }

      submitGenderIb.setOnClickListener { viewModel.updateWorkerGender() }

      // appTb.setAssistantClickListener {
      // assistant.playAssistantAudio(AssistantAudio.GENDER_PROMPT) }

      disableGenderSubmitButton()
    }
  }

  private fun observeUi() {
    viewModel.selectGenderUiState.observe(viewLifecycle, viewLifecycleScope) { state ->
      when (state) {
        is SelectGenderUiState.Success -> showSuccessUi(state.gender)
        is SelectGenderUiState.Error -> showErrorUi(state.throwable.message!!)
        SelectGenderUiState.Initial -> showInitialUi()
        SelectGenderUiState.Loading -> showLoadingUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.selectGenderEffects.observe(viewLifecycle, viewLifecycleScope) { effect ->
      when (effect) {
        SelectGenderEffects.Navigate -> navigateToAgeGroupFragment()
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      hideLoading()
      disableGenderSubmitButton()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      showLoading()
      disableGenderSubmitButton()
    }
  }

  private fun showSuccessUi(gender: Gender) {
    with(binding) {
      hideLoading()
      enableGenderSubmitButton()
      when (gender) {
        Gender.MALE -> selectMaleButton()
        Gender.FEMALE -> selectFemaleButton()
        Gender.OTHER -> selectOtherButton()
        Gender.NOT_SPECIFIED -> TODO()
      }
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      hideLoading()
      enableGenderSubmitButton()
    }
  }

  private fun disableGenderSubmitButton() {
    binding.submitGenderIb.disable()
  }

  private fun enableGenderSubmitButton() {
    binding.submitGenderIb.enable()
  }

  fun selectMaleButton() {
    with(binding) {
      cvMale.isSelected = true
      cvOther.isSelected = false
      cvFemale.isSelected = false
    }
  }

  fun selectFemaleButton() {
    with(binding) {
      cvMale.isSelected = false
      cvOther.isSelected = false
      cvFemale.isSelected = true
    }
  }

  fun selectOtherButton() {
    with(binding) {
      cvMale.isSelected = false
      cvFemale.isSelected = false
      cvOther.isSelected = true
    }
  }

  private fun navigateToAgeGroupFragment() {
    findNavController().navigate(R.id.action_selectGenderFragment2_to_selectAgeGroupFragment2)
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
      submitGenderIb.gone()
    }
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      submitGenderIb.visible()
    }
  }
}
