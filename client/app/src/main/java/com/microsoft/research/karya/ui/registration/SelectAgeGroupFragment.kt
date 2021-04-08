package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.View
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSelectAgeGroupBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding

class SelectAgeGroupFragment : Fragment(R.layout.fragment_select_age_group) {

    private val binding by viewBinding(FragmentSelectAgeGroupBinding::bind)

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity

    enum class ageGroup(val range: String) {
        YOUTH_AGE("18-25"),
        MIDDLE_AGE("26-50"),
        OLD_AGE("50+")
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        /** Setup the UI Strings **/
        var yearsString = getString(R.string.s_years)

        val youthLabel = ageGroup.YOUTH_AGE.range + " " + yearsString
        val middleLabel = ageGroup.MIDDLE_AGE.range + " " + yearsString
        val oldLabel = ageGroup.OLD_AGE.range + " " + yearsString

        binding.youthBtn.text = youthLabel
        binding.middleAgeBtn.text = middleLabel
        binding.oldAgeBtn.text = oldLabel

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_age_prompt

        binding.youthBtn.setOnClickListener { handleAgeGroupClick(ageGroup.YOUTH_AGE) }
        binding.middleAgeBtn.setOnClickListener { handleAgeGroupClick(ageGroup.MIDDLE_AGE) }
        binding.oldAgeBtn.setOnClickListener { handleAgeGroupClick(ageGroup.OLD_AGE) }

        binding.submitAgeGroupIb.setOnClickListener {
            binding.submitAgeGroupIb.visibility = View.INVISIBLE
            submitAgeGroup()
        }

        disableAgeGroupSubmitButton()

    }

    override fun onResume() {
        super.onResume()
        registrationActivity.onAssistantClick()
    }

    /**
     * Handle choice of age group
     */
    private fun handleAgeGroupClick(item: ageGroup) {
        WorkerInformation.age_group = item.range
        binding.youthBtn.isSelected = false
        binding.middleAgeBtn.isSelected = false
        binding.oldAgeBtn.isSelected = false
        when (item) {
            ageGroup.YOUTH_AGE -> {
                binding.youthBtn.isSelected = true
            }
            ageGroup.MIDDLE_AGE -> {
                binding.middleAgeBtn.isSelected = true
            }
            ageGroup.OLD_AGE -> {
                binding.oldAgeBtn.isSelected = true
            }
        }
        enableAgeGroupSubmitButton()
    }

    /**
     * Disable age group submit button
     */
    private fun disableAgeGroupSubmitButton() {
        binding.submitAgeGroupIb.isClickable = false
        binding.submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_disabled)
    }

    /**
     * Enable age group submit button
     */
    private fun enableAgeGroupSubmitButton() {
        binding.submitAgeGroupIb.isClickable = true
        binding.submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_enabled)
    }

    /**
     * Submit age group. This is the last step in the registration. After the user submits this
     * request, move to the register worker activity.
     */
    private fun submitAgeGroup() {
        findNavController().navigate(R.id.action_selectAgeGroupFragment_to_registerWorker)
    }
}
