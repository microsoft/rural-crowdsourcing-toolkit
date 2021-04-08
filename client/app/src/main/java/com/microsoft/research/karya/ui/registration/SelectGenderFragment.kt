package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSelectAgeGroupBinding
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

        binding.maleBtn.setOnClickListener {
            WorkerInformation.gender = "male"
            binding.maleBtn.isSelected = true
            binding.femaleBtn.isSelected = false
        }

        binding.femaleBtn.setOnClickListener {
            WorkerInformation.gender = "female"
            binding.femaleBtn.isSelected = true
            binding.maleBtn.isSelected = false
        }

        binding.submitGenderIb.setOnClickListener {
            binding.submitGenderIb.visibility = View.INVISIBLE
            findNavController().navigate(R.id.action_selectGenderFragment_to_selectAgeGroupFragment)
        }

    }

    override fun onResume() {
        super.onResume()
        registrationActivity.onAssistantClick()
    }
}
