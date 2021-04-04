package com.microsoft.research.karya.ui.registration

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.service.KaryaAPIService
import com.microsoft.research.karya.ui.base.BaseActivity
import kotlinx.android.synthetic.main.fragment_o_t_p.view.*
import kotlinx.android.synthetic.main.fragment_o_t_p.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

private const val OTP_LENGTH = 6

class OTPFragment : Fragment() {

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity
    private lateinit var karyaAPI: KaryaAPIService

    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity
        karyaAPI = baseActivity.karyaAPI

        // Inflate the layout for this fragment
        val fragmentView = inflater.inflate(R.layout.fragment_o_t_p, container, false)

        /** Initialising Strings  **/
        fragmentView.otpPromptTv.text = registrationActivity.otpPromptMessage
        fragmentView.invalidOTPTv.text = registrationActivity.invalidOTPMessage
        fragmentView.resendOTPBtn.text = registrationActivity.resendOTPMessage

        return fragmentView

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_otp_prompt

        /** Resend OTP handler */
        resendOTPBtn.setOnClickListener { resendOTP() }

        /** Set listener for the OTP text box */
        otpEt.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (s?.length == OTP_LENGTH)
                    handleOTPReady()
                else
                    handleOTPNotReady()
            }
        })
        baseActivity.requestSoftKeyFocus(otpEt)

    }

    /**
     * Handler called when full OTP is entered
     */
    private fun handleOTPReady() {
        otpEt.isEnabled = false
        verifyOTP(otpEt.text.toString())
    }

    /**
     * Handler called when OTP is not full length. Clear error message and
     * check box
     */
    private fun handleOTPNotReady() {
        invalidOTPTv.visibility = View.INVISIBLE
        otpStatusIv.setImageResource(0)
        otpStatusIv.setImageResource(R.drawable.ic_check_grey)
    }

    /**
     * Verify if the user has entered a valid OTP. If so, move to the next activity. Else,
     * show the invalid OTP message and enable the text box.
     */
    private fun verifyOTP(otp: String) {
        if (otp == WorkerInformation.otp) {
            otpStatusIv.setImageResource(0)
            otpStatusIv.setImageResource(R.drawable.ic_check)
            invalidOTPTv.visibility = View.INVISIBLE
            startActivity(Intent(activity, ProfilePictureActivity::class.java))
        } else {
            invalidOTPTv.visibility = View.VISIBLE
            otpStatusIv.setImageResource(0)
            otpStatusIv.setImageResource(R.drawable.ic_quit_select)
            otpEt.isEnabled = true
            baseActivity.requestSoftKeyFocus(otpEt)
        }
    }

    /**
     * Resend OTP
     */
    private fun resendOTP() {
        resendOTPBtn.visibility = View.GONE
        ioScope.launch {
            val worker = JsonObject()
            worker.addProperty("creation_code", WorkerInformation.creation_code)
            worker.addProperty("phone_number", WorkerInformation.phone_number)
            karyaAPI.resendOTP(worker)
        }
    }
}
