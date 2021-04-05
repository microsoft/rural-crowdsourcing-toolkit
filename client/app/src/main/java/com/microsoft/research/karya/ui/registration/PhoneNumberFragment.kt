package com.microsoft.research.karya.ui.registration

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.util.TypedValue
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseActivity
import kotlinx.android.synthetic.main.fragment_phone_number.*
import kotlinx.android.synthetic.main.fragment_phone_number.view.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PhoneNumberFragment : Fragment() {

    private val PHONE_NUMBER_LENGTH = 10
    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity
//    private lateinit var startForResult: ActivityResultLauncher<Intent>

    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    /** Callback to move forward in navigation graph after successful OTP send */
    var startForResult =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result: ActivityResult ->

            if (result.resultCode == Activity.RESULT_OK) {
                findNavController().navigate(R.id.action_phoneNumberFragment_to_OTPFragment)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        /** Initialising Strings  **/
        // TODO: Remove this implementation when we fetch strings from resource

        /** Inflating the layout for this fragment **/
        val fragmentView = inflater.inflate(R.layout.fragment_phone_number, container, false)

        /**
         * Set all initial UI strings
         */
        fragmentView.phoneNumberPromptTv.text = getString(R.string.s_phone_number_prompt)

        return fragmentView
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        registrationActivity.current_assistant_audio = R.string.audio_phone_number_prompt

        /** Set the phone number font size to the same value as the phantom text view font size */
        phantomPhoneNumberTv.addOnLayoutChangeListener { _: View, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int, _: Int ->
            phoneNumberEt.setTextSize(TypedValue.COMPLEX_UNIT_PX, phantomPhoneNumberTv.textSize)
        }

        /** Set phone number text change listener */
        phoneNumberEt.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (s?.length == PHONE_NUMBER_LENGTH) {
                    handlePhoneNumberReady()
                } else {
                    handlePhoneNumberNotReady()
                }
            }
        })
        baseActivity.requestSoftKeyFocus(phoneNumberEt)

        /** Phone number next button should not be clickable by default */
        phoneNumberNextIv.setOnClickListener {
            phoneNumberNextIv.visibility = View.INVISIBLE
            handleNextClick()
        }
        phoneNumberNextIv.isClickable = false

    }

    override fun onResume() {
        super.onResume()
        registrationActivity.onAssistantClick()
    }

    /** Update UI when the phone number is ready */
    private fun handlePhoneNumberReady() {
        uiScope.launch {
            phoneNumberNextIv.setImageResource(0)
            phoneNumberNextIv.setImageResource(R.drawable.ic_next_enabled)
            phoneNumberNextIv.isClickable = true
        }
    }

    /** Update UI when the phone number is ready */
    private fun handlePhoneNumberNotReady() {
        uiScope.launch {
            phoneNumberNextIv.setImageResource(0)
            phoneNumberNextIv.setImageResource(R.drawable.ic_next_disabled)
            phoneNumberNextIv.isClickable = false
        }
    }

    /** On next click, hide keyboard. Send request to send OTP to the phone number */
    private fun handleNextClick() {
        baseActivity.hideKeyboard()
        WorkerInformation.phone_number = phoneNumberEt.text.toString()

        startForResult.launch(Intent(activity, SendOTPActivity::class.java))
    }


}
