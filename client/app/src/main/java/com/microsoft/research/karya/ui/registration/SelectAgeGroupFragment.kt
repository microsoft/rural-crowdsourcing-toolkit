package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import kotlinx.android.synthetic.main.fragment_select_age_group.*
import kotlinx.android.synthetic.main.fragment_select_age_group.view.*

class SelectAgeGroupFragment : Fragment() {

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {
        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        // Inflate the layout for this fragment
        val fragmentView = inflater.inflate(R.layout.fragment_select_age_group, container, false)

        /** Initialising Strings  **/

        var yearsString = getString(R.string.s_years)

        val youthLabel = "18-25 $yearsString"
        val middleLabel = "26-50 $yearsString"
        val oldLabel = "50+ $yearsString"
        fragmentView.ageGroupPromptTv.text = getString(R.string.s_age_prompt)
        fragmentView.youthBtn.text = youthLabel
        fragmentView.middleAgeBtn.text = middleLabel
        fragmentView.oldAgeBtn.text = oldLabel

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_age_prompt

        return fragmentView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        youthBtn.setOnClickListener { handleAgeGroupClick("18-25") }
        middleAgeBtn.setOnClickListener { handleAgeGroupClick("26-50") }
        oldAgeBtn.setOnClickListener { handleAgeGroupClick("50+") }

        submitAgeGroupIb.setOnClickListener {
            submitAgeGroupIb.visibility = View.INVISIBLE
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
    private fun handleAgeGroupClick(ageGroup: String) {
        WorkerInformation.age_group = ageGroup
        youthBtn.isSelected = false
        middleAgeBtn.isSelected = false
        oldAgeBtn.isSelected = false
        when (ageGroup) {
            "18-25" -> {
                youthBtn.isSelected = true
            }
            "26-50" -> {
                middleAgeBtn.isSelected = true
            }
            "50+" -> {
                oldAgeBtn.isSelected = true
            }
        }
        enableAgeGroupSubmitButton()
    }

    /**
     * Disable age group submit button
     */
    private fun disableAgeGroupSubmitButton() {
        submitAgeGroupIb.isClickable = false
        submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_disabled)
    }

    /**
     * Enable age group submit button
     */
    private fun enableAgeGroupSubmitButton() {
        submitAgeGroupIb.isClickable = true
        submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_enabled)
    }

    /**
     * Submit age group. This is the last step in the registration. After the user submits this
     * request, move to the register worker activity.
     */
    private fun submitAgeGroup() {
        findNavController().navigate(R.id.action_selectAgeGroupFragment_to_registerWorker)
    }
}
