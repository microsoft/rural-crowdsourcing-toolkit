package com.microsoft.research.karya.ui.registration

import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import kotlinx.android.synthetic.main.fragment_select_gender.*
import kotlinx.android.synthetic.main.fragment_select_gender.view.*
import kotlinx.android.synthetic.main.fragment_o_t_p.view.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

class SelectGenderFragment : Fragment() {

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity

    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        // Inflate the layout for this fragment
        val fragmentView = inflater.inflate(R.layout.fragment_select_gender, container, false)

        /** Initialising Strings  **/

        fragmentView.selectGenderPromptTv.text = getString(R.string.s_gender_prompt)
        fragmentView.maleTv.text = getString(R.string.s_male)
        fragmentView.femaleTv.text = getString(R.string.s_female)

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_gender_prompt

        return fragmentView

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        WorkerInformation.gender = "not_specified"

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

    override fun onResume() {
        super.onResume()
        registrationActivity.onAssistantClick()
    }
}
