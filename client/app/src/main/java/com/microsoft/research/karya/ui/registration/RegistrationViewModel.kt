package com.microsoft.research.karya.ui.registration

import android.util.Log
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import javax.inject.Inject

// TODO: ADD dependencies in the constructor
@HiltViewModel
class RegistrationViewModel @Inject constructor(
    private val workerRepository: WorkerRepository,
    private val languageRepository: LanguageRepository,
    private val karyaFileRepository: KaryaFileRepository,
) : ViewModel() {

    enum class OtpVerifyState {
        NOT_ENTERED,
        SUCCESS,
        FAIL
    }

    enum class OtpSendState {
        NOT_SENT,
        SUCCESS,
        FAIL
    }

    val openDashBoardFromOTP = MutableLiveData<Boolean>()
    val openProfilePictureFragmentFromOTP = MutableLiveData<Boolean>()
    val OtpVerifyCurrentState = MutableLiveData<OtpVerifyState>()
    val currOtpSendState = MutableLiveData<OtpSendState>()
    val sendOtpErrorMesssage = MutableLiveData<String>()

    init {
        openDashBoardFromOTP.value = false
        openProfilePictureFragmentFromOTP.value = false
        OtpVerifyCurrentState.value = OtpVerifyState.NOT_ENTERED
        currOtpSendState.value = OtpSendState.NOT_SENT
    }

    fun verifyOTP(otp: String) {
        workerRepository.getOrVerifyOTP(
            WorkerInformation.creation_code!!,
            WorkerInformation.phone_number!!,
            otp,
            WorkerRepository.OtpAction.VERIFY.name.toLowerCase()
        ).onEach { workerRecord ->

            OtpVerifyCurrentState.value = OtpVerifyState.SUCCESS

            if (workerRecord.age.isNullOrEmpty()) {
                // First time registration, go on with the regular registration flow
                openProfilePictureFragmentFromOTP.value = true
            } else {
                // Save the worker and navigate to dashboard
                workerRepository.upsertWorker(workerRecord)
                openDashBoardFromOTP.value = true
            }

        }.catch {
            OtpVerifyCurrentState.value = OtpVerifyState.FAIL
        }.launchIn(viewModelScope)
    }

    fun sendOTP(phoneNumber: String) {
        WorkerInformation.phone_number = phoneNumber
        Log.i("SEND_OTP", WorkerInformation.phone_number!! + " " + WorkerInformation.creation_code!!)
        workerRepository.getOrVerifyOTP(
            WorkerInformation.creation_code!!,
            WorkerInformation.phone_number!!,
            "",
            WorkerRepository.OtpAction.GENERATE.name.toLowerCase()
        ).onEach {
            currOtpSendState.value = OtpSendState.SUCCESS
        }.catch { e ->
            sendOtpErrorMesssage.value = e.message
            currOtpSendState.value = OtpSendState.FAIL
        }.launchIn(viewModelScope)
    }

    /**
     * Resend OTP
     */
    fun resendOTP() {
        workerRepository.getOrVerifyOTP(
            WorkerInformation.creation_code!!,
            WorkerInformation.phone_number!!,
            "",
            WorkerRepository.OtpAction.RESEND.name.toLowerCase()
        ).onEach {
            // Indicate to the UI that OTP is sent
        }.catch {
            // Indicate that the Request was not successful
        }.launchIn(viewModelScope)
    }


}
