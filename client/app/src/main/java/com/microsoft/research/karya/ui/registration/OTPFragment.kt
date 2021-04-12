package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import androidx.fragment.app.Fragment
import android.view.View
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.service.KaryaAPIService
import com.microsoft.research.karya.databinding.FragmentOTPBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

private const val OTP_LENGTH = 6

class OTPFragment : Fragment(R.layout.fragment_o_t_p) {

    private val binding by viewBinding(FragmentOTPBinding::bind)

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity
    private lateinit var karyaAPI: KaryaAPIService

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity
        karyaAPI = baseActivity.karyaAPI

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_otp_prompt

        /** Resend OTP handler */
        binding.resendOTPBtn.setOnClickListener { resendOTP() }

        /** Set listener for the OTP text box */
        binding.otpEt.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (s?.length == OTP_LENGTH)
                    handleOTPReady()
                else
                    handleOTPNotReady()
            }
        })
        baseActivity.requestSoftKeyFocus(binding.otpEt)

    }

    override fun onResume() {
        super.onResume()
        registrationActivity.onAssistantClick()
    }

    /**
     * Handler called when full OTP is entered
     */
    private fun handleOTPReady() {
        binding.otpEt.isEnabled = false
        verifyOTP(binding.otpEt.text.toString())
    }

    /**
     * Handler called when OTP is not full length. Clear error message and
     * check box
     */
    private fun handleOTPNotReady() {
        binding.invalidOTPTv.visibility = View.INVISIBLE
        binding.otpStatusIv.setImageResource(0)
        binding.otpStatusIv.setImageResource(R.drawable.ic_check_grey)
    }

    /**
     * Verify if the user has entered a valid OTP. If so, move to the next activity. Else,
     * show the invalid OTP message and enable the text box.
     */
    private fun verifyOTP(otp: String) {
        if (otp == WorkerInformation.otp) {
            binding.otpStatusIv.setImageResource(0)
            binding.otpStatusIv.setImageResource(R.drawable.ic_check)
            binding.invalidOTPTv.visibility = View.INVISIBLE
            findNavController().navigate(R.id.action_OTPFragment_to_profilePictureFragment)
        } else {
            binding.invalidOTPTv.visibility = View.VISIBLE
            binding.otpStatusIv.setImageResource(0)
            binding.otpStatusIv.setImageResource(R.drawable.ic_quit_select)
            binding.otpEt.isEnabled = true
            baseActivity.requestSoftKeyFocus(binding.otpEt)
        }
    }

    /**
     * Resend OTP
     */
    private fun resendOTP() {
        binding.resendOTPBtn.visibility = View.GONE
        lifecycleScope.launch(Dispatchers.IO) {
            val worker = JsonObject()
            worker.addProperty("creation_code", WorkerInformation.creation_code)
            worker.addProperty("phone_number", WorkerInformation.phone_number)
            karyaAPI.resendOTP(worker)
        }
    }
}
