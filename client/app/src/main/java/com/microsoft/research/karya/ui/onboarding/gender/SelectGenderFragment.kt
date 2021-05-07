package com.microsoft.research.karya.ui.onboarding.gender

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSelectGenderBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class SelectGenderFragment : Fragment(R.layout.fragment_select_gender) {

  private val binding by viewBinding(FragmentSelectGenderBinding::bind)
  private val viewModel by viewModels<SelectGenderViewModel>()
  var gender = "not_specified"

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupViews()
    observeUi()
    observeEffects()
    // registrationActivity.current_assistant_audio = R.string.audio_gender_prompt
  }

  private fun setupViews() {
    with(binding) {
      maleBtn.setOnClickListener {
        gender = "male"
        maleBtn.isSelected = true
        femaleBtn.isSelected = false
        enableGenderSubmitButton()
      }

      femaleBtn.setOnClickListener {
        gender = "female"
        femaleBtn.isSelected = true
        maleBtn.isSelected = false
        enableGenderSubmitButton()
      }

      submitGenderIb.setOnClickListener { viewModel.updateWorkerGender(gender) }

      appTb.setTitle(getString(R.string.s_gender_title))
    }
  }

  private fun observeUi() {
    viewModel.selectGenderUiState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      when (state) {
        is SelectGenderUiState.Error -> showErrorUi(state.throwable.message!!)
        SelectGenderUiState.Initial -> showInitialUi()
        SelectGenderUiState.Loading -> showLoadingUi()
        SelectGenderUiState.Success -> showSuccessUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.selectGenderEffects.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { effect ->
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
      showLoadingUi()
      disableGenderSubmitButton()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      hideLoading()
      enableGenderSubmitButton()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      hideLoading()
      enableGenderSubmitButton()
    }
  }

  private fun disableGenderSubmitButton() {
    with(binding) {
      submitGenderIb.isClickable = false
      submitGenderIb.setBackgroundResource(R.drawable.ic_next_disabled)
    }
  }

  private fun enableGenderSubmitButton() {
    with(binding) {
      submitGenderIb.isClickable = true
      submitGenderIb.setBackgroundResource(R.drawable.ic_next_enabled)
    }
  }

  private fun navigateToAgeGroupFragment() {
    findNavController().navigate(R.id.action_selectGenderFragment_to_selectAgeGroupFragment)
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
