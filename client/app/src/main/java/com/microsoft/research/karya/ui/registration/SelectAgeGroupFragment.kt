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

    enum class ageGroup(val range: String) {
        YOUTH_AGE("18-25"),
        MIDDLE_AGE("26-50"),
        OLD_AGE("50+")
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {
        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        /** Inflating the layout for this fragment **/
        val fragmentView = inflater.inflate(R.layout.fragment_select_age_group, container, false)

        /** Initialising Strings  **/

        var yearsString = getString(R.string.s_years)

        val youthLabel = ageGroup.YOUTH_AGE.range + " " + yearsString
        val middleLabel = ageGroup.MIDDLE_AGE.range + " " + yearsString
        val oldLabel = ageGroup.OLD_AGE.range + " " + yearsString

        fragmentView.youthBtn.text = youthLabel
        fragmentView.middleAgeBtn.text = middleLabel
        fragmentView.oldAgeBtn.text = oldLabel

        return fragmentView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_age_prompt

        youthBtn.setOnClickListener { handleAgeGroupClick(ageGroup.YOUTH_AGE) }
        middleAgeBtn.setOnClickListener { handleAgeGroupClick(ageGroup.MIDDLE_AGE) }
        oldAgeBtn.setOnClickListener { handleAgeGroupClick(ageGroup.OLD_AGE) }

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
    private fun handleAgeGroupClick(item: ageGroup) {
        WorkerInformation.age_group = item.range
        youthBtn.isSelected = false
        middleAgeBtn.isSelected = false
        oldAgeBtn.isSelected = false
        when (item) {
            ageGroup.YOUTH_AGE -> {
                youthBtn.isSelected = true
            }
            ageGroup.MIDDLE_AGE -> {
                middleAgeBtn.isSelected = true
            }
            ageGroup.OLD_AGE -> {
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
