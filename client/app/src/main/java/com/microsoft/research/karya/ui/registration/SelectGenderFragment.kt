package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSelectGenderBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding

class SelectGenderFragment : Fragment(R.layout.fragment_select_gender) {

    private val binding by viewBinding(FragmentSelectGenderBinding::bind)

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_gender_prompt

        WorkerInformation.gender = "not_specified"

        with(binding) {
            maleBtn.setOnClickListener {
                WorkerInformation.gender = "male"
                maleBtn.isSelected = true
                femaleBtn.isSelected = false
            }

            femaleBtn.setOnClickListener {
                WorkerInformation.gender = "female"
                femaleBtn.isSelected = true
                maleBtn.isSelected = false
            }

            submitGenderIb.setOnClickListener {
                submitGenderIb.visibility = View.INVISIBLE
                findNavController().navigate(R.id.action_selectGenderFragment_to_selectAgeGroupFragment)
            }
        }

    }

}
