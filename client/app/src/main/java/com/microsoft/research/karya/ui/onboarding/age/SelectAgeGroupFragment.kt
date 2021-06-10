package com.microsoft.research.karya.ui.onboarding.age

import android.os.Bundle
import android.view.View
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.databinding.FragmentSelectAgeGroupBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SelectAgeGroupFragment : BaseFragment(R.layout.fragment_select_age_group) {

  private val binding by viewBinding(FragmentSelectAgeGroupBinding::bind)
  private val viewModel by viewModels<SelectAgeViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupView()
    observeUi()
    observeEffects()
    // registrationActivity.current_assistant_audio = R.string.audio_age_prompt
  }

  override fun onResume() {
    super.onResume()
    assistant.playAssistantAudio(AssistantAudio.AGE_PROMPT)
  }

  private fun setupView() {
    with(binding) {
      appTb.setTitle(getString(R.string.s_age_title))
      // appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.AGE_PROMPT) }

      ageEt.doAfterTextChanged { text ->
        if (text?.length == 4) {
          enableAgeGroupSubmitButton()
        } else {
          disableAgeGroupSubmitButton()
        }
      }

      submitAgeGroupIb.setOnClickListener { submitYOB(ageEt.text.toString()) }
    }
  }

  private fun observeUi() {
    viewModel.selectAgeUiState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      when (state) {
        is SelectAgeUiState.Error -> showErrorUi(state.throwable.message!!)
        SelectAgeUiState.Initial -> showInitialUi()
        SelectAgeUiState.Loading -> showLoadingUi()
        SelectAgeUiState.Success -> showSuccessUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.selectAgeEffects.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { effect ->
      when (effect) {
        SelectAgeEffects.Navigate -> navigateToDashboard()
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      failToRegisterTv.gone()
      ageEt.text.clear()
      hideLoading()
      disableAgeGroupSubmitButton()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      failToRegisterTv.gone()
      showLoading()
      disableAgeGroupSubmitButton()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      failToRegisterTv.gone()
      hideLoading()
      enableAgeGroupSubmitButton()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      failToRegisterTv.text = message
      failToRegisterTv.visible()
      hideLoading()
      enableAgeGroupSubmitButton()
    }
  }

  private fun disableAgeGroupSubmitButton() {
    binding.submitAgeGroupIb.disable()
  }

  private fun enableAgeGroupSubmitButton() {
    binding.submitAgeGroupIb.enable()
  }

  private fun submitYOB(yob: String) {
    viewModel.updateWorkerYOB(yob)
  }

  private fun hideLoading() {
    with(binding) {
      loadingPb.gone()
      submitAgeGroupIb.visible()
    }
  }

  private fun showLoading() {
    with(binding) {
      loadingPb.visible()
      submitAgeGroupIb.gone()
    }
  }

  private fun navigateToDashboard() {
    findNavController().navigate(R.id.action_global_dashboardActivity4)
  }
}
