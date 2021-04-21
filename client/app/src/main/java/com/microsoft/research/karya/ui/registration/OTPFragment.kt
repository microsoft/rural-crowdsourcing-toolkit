package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import androidx.fragment.app.Fragment
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Observer
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.OtpSendState
import com.microsoft.research.karya.data.model.karya.enums.OtpVerifyState
import com.microsoft.research.karya.data.service.KaryaAPIService
import com.microsoft.research.karya.databinding.FragmentOtpBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.viewBinding
import dagger.hilt.android.AndroidEntryPoint

private const val OTP_LENGTH = 6

@AndroidEntryPoint
class OTPFragment : Fragment(R.layout.fragment_otp) {

    private val binding by viewBinding(FragmentOtpBinding::bind)
    private val viewModel by activityViewModels<RegistrationViewModel>()

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity
    private lateinit var karyaAPI: KaryaAPIService

    private fun setupObservers() {
        viewModel.openDashBoardFromOTP.observe(viewLifecycleOwner, Observer { openDashBoard ->
            if (openDashBoard) {
                navigateToDashBoard()
            }
        })

        viewModel.openProfilePictureFragmentFromOTP.observe(viewLifecycleOwner, { openProfilePictureFragment ->
            if (openProfilePictureFragment) {
                navigateToProfilePicture()
            }
        })

        viewModel.currOtpVerifyState.observe(viewLifecycleOwner, { state ->
            when (state) {
                OtpVerifyState.SUCCESS -> onOtpVerifySuccess()
                OtpVerifyState.FAIL -> onOtpVerifyOrResendFailure()
                OtpVerifyState.NOT_ENTERED -> setOtpNotSentUI()
            }
        })

        viewModel.currOtpResendState.observe(viewLifecycleOwner, { state ->
            when (state) {
                // TODO: Maybe indicate user after successful otp sent
                OtpSendState.FAIL -> onOtpVerifyOrResendFailure()
            }
        })
    }

    private fun navigateToDashBoard() {
        findNavController().navigate(R.id.action_OTPFragment_to_dashboardActivity2)
        viewModel.afterNavigateToDashboard()
    }

    private fun navigateToProfilePicture() {
        findNavController().navigate(R.id.action_OTPFragment_to_profilePictureFragment)
        viewModel.afterNavigateToProfilePicture()
    }

    private fun onOtpVerifySuccess() {
        binding.otpStatusIv.setImageResource(0)
        binding.otpStatusIv.setImageResource(R.drawable.ic_check)
        binding.invalidOTPTv.visibility = View.INVISIBLE
    }

    private fun onOtpVerifyOrResendFailure() {
        with(binding) {
            invalidOTPTv.visibility = View.VISIBLE
            invalidOTPTv.text = getString(viewModel.otpFragmentErrorId) // TODO: Change TextView id
            otpStatusIv.setImageResource(0)
            otpStatusIv.setImageResource(R.drawable.ic_quit_select)
            otpEt.isEnabled = true
            baseActivity.requestSoftKeyFocus(binding.otpEt)
        }
    }

    private fun setOtpNotSentUI() {
        // No Action has to take place since OTP is not sent
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupObservers()

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
        viewModel.verifyOTP(binding.otpEt.text.toString())
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
     * Resend OTP
     */
    private fun resendOTP() {
        binding.resendOTPBtn.visibility = View.GONE
        viewModel.resendOTP()
    }
}
