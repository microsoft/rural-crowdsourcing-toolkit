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
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setUpObservers()

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        /** Setup the UI Strings **/
        val yearsString = getString(R.string.s_years)

        val youthLabel = "${AgeGroup.YOUTH_AGE.range} $yearsString"
        val middleLabel = "${AgeGroup.MIDDLE_AGE.range} $yearsString"
        val oldLabel = "${AgeGroup.OLD_AGE.range} $yearsString"

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_age_prompt

        with(binding) {
            youthBtn.text = youthLabel
            middleAgeBtn.text = middleLabel
            oldAgeBtn.text = oldLabel

            youthBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.YOUTH_AGE) }
            middleAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.MIDDLE_AGE) }
            oldAgeBtn.setOnClickListener { handleAgeGroupClick(AgeGroup.OLD_AGE) }

            submitAgeGroupIb.setOnClickListener {
                submitAgeGroupIb.visibility = View.INVISIBLE
                submitAgeGroup()
            }
        }

        disableAgeGroupSubmitButton()

    }

    override fun onResume() {
        super.onResume()
//        registrationActivity.onAssistantClick()
        // TODO: Add Assistant
    }

    /**
     * Handle choice of age group
     */
    private fun handleAgeGroupClick(item: AgeGroup) {
        WorkerInformation.age_group = item.range
        binding.youthBtn.isSelected = false
        binding.middleAgeBtn.isSelected = false
        binding.oldAgeBtn.isSelected = false
        when (item) {
            AgeGroup.YOUTH_AGE -> {
                binding.youthBtn.isSelected = true
            }
            AgeGroup.MIDDLE_AGE -> {
                binding.middleAgeBtn.isSelected = true
            }
            AgeGroup.OLD_AGE -> {
                binding.oldAgeBtn.isSelected = true
            }
        }
        enableAgeGroupSubmitButton()
    }

    /**
     * Disable age group submit button
     */
    private fun disableAgeGroupSubmitButton() {
        with(binding) {
            submitAgeGroupIb.isClickable = false
            submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_disabled)
        }
    }

    /**
     * Enable age group submit button
     */
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
        viewModel.registerWorker()
    }
}
