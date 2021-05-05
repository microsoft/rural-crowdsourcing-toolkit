package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AgeGroup
import com.microsoft.research.karya.data.model.karya.enums.RegisterWorkerState
import com.microsoft.research.karya.databinding.FragmentSelectAgeGroupBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding

class SelectAgeGroupFragment : Fragment(R.layout.fragment_select_age_group) {

  private val binding by viewBinding(FragmentSelectAgeGroupBinding::bind)
  private val viewModel by activityViewModels<RegistrationViewModel>()

  private lateinit var registrationActivity: RegistrationActivity
  private lateinit var baseActivity: BaseActivity

  lateinit var currentAge: AgeGroup

  private fun setUpObservers() {
    viewModel.currRegisterState.observe(viewLifecycleOwner) { state ->
      when (state) {
        RegisterWorkerState.SUCCESS -> navigateToDashboard()
        RegisterWorkerState.FAILURE -> onRegisterWorkerFailure()
        RegisterWorkerState.NOT_STARTED -> onRegisterWorkerNotStarted()
      }
    }
  }

  private fun onRegisterWorkerNotStarted() {
    binding.failToRegisterTv.visibility = View.INVISIBLE
  }

  private fun onRegisterWorkerFailure() {
    with(binding) {
      failToRegisterTv.text = getString(viewModel.selectAgeGroupFragmentErrorId)
      failToRegisterTv.visibility = View.VISIBLE
    }
  }

  private fun navigateToDashboard() {
    findNavController().navigate(R.id.action_selectAgeGroupFragment_to_dashboardActivity2)
    requireActivity().finish()
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setUpObservers()

    registrationActivity = activity as RegistrationActivity
    baseActivity = activity as BaseActivity

    /** Setup the UI Strings */
    val yearsString = getString(R.string.s_years)

    val youthLabel = "${AgeGroup.YOUNG.range} $yearsString"
    val middleLabel = "${AgeGroup.MIDDLE.range} $yearsString"
    val oldLabel = "${AgeGroup.OLD.range} $yearsString"

    /** Initialise assistant audio */
    // registrationActivity.current_assistant_audio = R.string.audio_age_prompt

    with(binding) {
      youthBtn.text = youthLabel
      middleAgeBtn.text = middleLabel
      oldAgeBtn.text = oldLabel

      youthBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.YOUNG) }
      middleAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.MIDDLE) }
      oldAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.OLD) }

      submitAgeGroupIb.setOnClickListener {
        submitAgeGroupIb.visibility = View.INVISIBLE
        submitAgeGroup()
      }
    }

    disableAgeGroupSubmitButton()
  }

  /** Handle choice of age group */
  private fun handleAgeGroupClick(item: AgeGroup) {
    WorkerInformation.age_group = item.range
    binding.youthBtn.isSelected = false
    binding.middleAgeBtn.isSelected = false
    binding.oldAgeBtn.isSelected = false
    currentAge = item
    when (item) {
      AgeGroup.YOUNG -> {
        binding.youthBtn.isSelected = true
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

  /** Disable age group submit button */
  private fun disableAgeGroupSubmitButton() {
    with(binding) {
      submitAgeGroupIb.isClickable = false
      submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_disabled)
    }
  }

  /** Enable age group submit button */
  private fun enableAgeGroupSubmitButton() {
    with(binding) {
      submitAgeGroupIb.isClickable = true
      submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_enabled)
    }
  }

  /**
   * Submit age group. This is the last step in the registration. After the user submits this
   * request, move to the register worker activity.
   */
  private fun submitAgeGroup() {
    viewModel.updateWorkerAge(currentAge)
  }
}
