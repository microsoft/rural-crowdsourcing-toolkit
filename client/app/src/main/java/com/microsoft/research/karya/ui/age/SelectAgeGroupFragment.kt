package com.microsoft.research.karya.ui.age

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AgeGroup
import com.microsoft.research.karya.databinding.FragmentSelectAgeGroupBinding
<<<<<<< Updated upstream:client/app/src/main/java/com/microsoft/research/karya/ui/age/SelectAgeGroupFragment.kt
import com.microsoft.research.karya.utils.extensions.viewBinding
=======
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import kotlinx.coroutines.flow.collect
>>>>>>> Stashed changes:client/app/src/main/java/com/microsoft/research/karya/ui/registration/SelectAgeGroupFragment.kt

class SelectAgeGroupFragment : Fragment(R.layout.fragment_select_age_group) {

  private val binding by viewBinding(FragmentSelectAgeGroupBinding::bind)
  private val viewModel by viewModels<SelectAgeViewModel>()

  lateinit var currentAge: AgeGroup

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupView()
    observeUi()
    observeEffects()
    // registrationActivity.current_assistant_audio = R.string.audio_age_prompt
  }

  private fun setupView() {
    with(binding) {
      youngAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.YOUNG) }
      middleAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.MIDDLE) }
      oldAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.OLD) }

      submitAgeGroupIb.setOnClickListener {
        submitAgeGroup()
      }

      appTb.setTitle(getString(R.string.s_age_title))
    }
  }

  private fun observeUi() {
    viewModel.selectAgeUiState.observe(lifecycle, lifecycleScope) { state ->
      when (state) {
        is SelectAgeUiState.Error -> showErrorUi(state.throwable.message!!)
        SelectAgeUiState.Initial -> showInitialUi()
        SelectAgeUiState.Loading -> showLoadingUi()
        SelectAgeUiState.Success -> showSuccessUi()
      }
    }
  }

  private fun observeEffects() {
    lifecycleScope.launchWhenStarted {
      viewModel.selectAgeEffects.collect { effect ->
        when (effect) {
          SelectAgeEffects.Navigate -> navigateToDashboard()
        }
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      failToRegisterTv.gone()
      disableAgeGroupSubmitButton()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      failToRegisterTv.gone()
      disableAgeGroupSubmitButton()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      failToRegisterTv.gone()
      enableAgeGroupSubmitButton()
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      failToRegisterTv.text = message
      failToRegisterTv.visible()
      disableAgeGroupSubmitButton()
    }
  }

  private fun handleAgeGroupClick(item: AgeGroup) {
    binding.youngAgeBtn.isSelected = false
    binding.middleAgeBtn.isSelected = false
    binding.oldAgeBtn.isSelected = false
    currentAge = item

    when (item) {
      AgeGroup.YOUNG -> {
        binding.youngAgeBtn.isSelected = true
      }
      AgeGroup.MIDDLE -> {
        binding.middleAgeBtn.isSelected = true
      }
      AgeGroup.OLD -> {
        binding.oldAgeBtn.isSelected = true
      }
    }

    enableAgeGroupSubmitButton()
  }

  private fun disableAgeGroupSubmitButton() {
    with(binding) {
      submitAgeGroupIb.isClickable = false
      submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_disabled)
    }
  }

  private fun enableAgeGroupSubmitButton() {
    with(binding) {
      submitAgeGroupIb.isClickable = true
      submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_enabled)
    }
  }

  private fun submitAgeGroup() {
    viewModel.updateWorkerAge(currentAge)
  }

  private fun navigateToDashboard() {
    findNavController().navigate(R.id.action_selectAgeGroupFragment_to_dashboardActivity2)
    requireActivity().finish()
  }
}
