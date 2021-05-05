package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentSelectGenderBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding

class SelectGenderFragment : Fragment(R.layout.fragment_select_gender) {

  private val binding by viewBinding(FragmentSelectGenderBinding::bind)
  private val viewModel by activityViewModels<RegistrationViewModel>()
  private lateinit var registrationActivity: RegistrationActivity
  private lateinit var baseActivity: BaseActivity

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    registrationActivity = activity as RegistrationActivity
    baseActivity = activity as BaseActivity
    var gender = "not_specified"

    /** Initialise assistant audio */
    // registrationActivity.current_assistant_audio = R.string.audio_gender_prompt

    with(binding) {
      maleBtn.setOnClickListener {
        gender = "male"
        maleBtn.isSelected = true
        femaleBtn.isSelected = false
      }

      femaleBtn.setOnClickListener {
        gender = "female"
        femaleBtn.isSelected = true
        maleBtn.isSelected = false
      }

      submitGenderIb.setOnClickListener {
        submitGenderIb.visibility = View.INVISIBLE
        viewModel.updateWorkerGender(gender)
        findNavController().navigate(R.id.action_selectGenderFragment_to_selectAgeGroupFragment)
      }

      appTb.setTitle(getString(R.string.s_gender_title))
    }
  }
}
