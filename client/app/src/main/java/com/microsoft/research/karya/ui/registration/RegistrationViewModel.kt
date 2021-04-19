package com.microsoft.research.karya.ui.registration

import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.IncorrectAccessCodeException
import com.microsoft.research.karya.data.exceptions.IncorrectOtpException
import com.microsoft.research.karya.data.exceptions.PhoneNumberAlreadyUsedException
import com.microsoft.research.karya.data.exceptions.UnknownException
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import java.lang.Exception
import javax.inject.Inject
import kotlin.properties.Delegates
import kotlin.reflect.typeOf

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

    private val _openDashBoardFromOTP = MutableLiveData<Boolean>()
    val openDashBoardFromOTP: LiveData<Boolean>
        get() =_openDashBoardFromOTP

    private val _openProfilePictureFragmentFromOTP = MutableLiveData<Boolean>()
    val openProfilePictureFragmentFromOTP: LiveData<Boolean>
        get() = _openProfilePictureFragmentFromOTP

    private val _currOtpVerifyState = MutableLiveData<OtpVerifyState>()
    val currOtpVerifyState: LiveData<OtpVerifyState>
        get() = _currOtpVerifyState

    private val _currOtpSendState = MutableLiveData<OtpSendState>()
    val currOtpSendState: LiveData<OtpSendState>
        get() = _currOtpSendState

    private val _currOtpResendState = MutableLiveData<OtpSendState>()
    val currOtpResendState: LiveData<OtpSendState>
        get() = _currOtpResendState

    var phoneNumberFragmentErrorId by Delegates.notNull<Int>()
    var otpFragmentErrorId by Delegates.notNull<Int>()

    init {
        _openDashBoardFromOTP.value = false
        _openProfilePictureFragmentFromOTP.value = false

        _currOtpVerifyState.value = OtpVerifyState.NOT_ENTERED
        _currOtpSendState.value = OtpSendState.NOT_SENT
        _currOtpResendState.value = OtpSendState.NOT_SENT
    }

    fun sendOTP(phoneNumber: String) {
        WorkerInformation.phone_number = phoneNumber
        WorkerInformation.creation_code = "4337334745315309"
        WorkerInformation.app_language = 1
        Log.i("SEND_OTP", WorkerInformation.phone_number!! + " " + WorkerInformation.creation_code!!)
        workerRepository.getOrVerifyOTP(
            WorkerInformation.creation_code!!,
            WorkerInformation.phone_number!!,
            "",
            WorkerRepository.OtpAction.GENERATE.name.toLowerCase()
        ).onEach {
            _currOtpSendState.value = OtpSendState.SUCCESS
        }.catch { e ->
            sendGenerateOtpError(e)
        }.launchIn(viewModelScope)
    }

    fun verifyOTP(otp: String) {
        workerRepository.getOrVerifyOTP(
            WorkerInformation.creation_code!!,
            WorkerInformation.phone_number!!,
            otp,
            WorkerRepository.OtpAction.VERIFY.name.toLowerCase()
        ).onEach { workerRecord ->

            _currOtpVerifyState.value = OtpVerifyState.SUCCESS

            if (workerRecord.age.isNullOrEmpty()) {
                // First time registration, go on with the regular registration flow
                _openProfilePictureFragmentFromOTP.value = true
            } else {
                // Save the worker and navigate to dashboard
                workerRepository.upsertWorker(workerRecord)
                _openDashBoardFromOTP.value = true
            }

        }.catch { e->
            sendVerifyOtpError(e)
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
            _currOtpResendState.value = OtpSendState.SUCCESS
        }.catch { e ->
            sendResendOtpError(e)
        }.launchIn(viewModelScope)
    }

    private fun sendGenerateOtpError(e: Throwable) {
        phoneNumberFragmentErrorId = when (e) {
            is PhoneNumberAlreadyUsedException -> R.string.s_phone_number_already_used
            is IncorrectAccessCodeException -> R.string.s_invalid_creation_code // this case should never happen
            is UnknownException -> R.string.s_unknown_error
            else -> R.string.s_unknown_error
        }
        _currOtpSendState.value = OtpSendState.FAIL
    }

    private fun sendResendOtpError(e: Throwable) {
        otpFragmentErrorId = when (e) {
            is UnknownError -> R.string.s_unknown_error
            else -> R.string.s_unknown_error
        }
        _currOtpResendState.value = OtpSendState.FAIL
    }

    private fun sendVerifyOtpError(e: Throwable) {
        otpFragmentErrorId = when (e) {
            is IncorrectOtpException -> R.string.s_invalid_otp
            is UnknownError -> R.string.s_unknown_error
            else -> R.string.s_unknown_error
        }
        _currOtpVerifyState.value = OtpVerifyState.FAIL
    }

    fun afterNavigateToProfilePicture() {
        _openProfilePictureFragmentFromOTP.value = false
        _currOtpResendState.value = OtpSendState.NOT_SENT
        _currOtpSendState.value = OtpSendState.NOT_SENT
    }

    fun afterNavigateToDashboard() {
        _openDashBoardFromOTP.value = false
        _currOtpResendState.value = OtpSendState.NOT_SENT
        _currOtpSendState.value = OtpSendState.NOT_SENT
    }

    fun resetOtpSendState() {
        _currOtpSendState.value = OtpSendState.NOT_SENT
    }


}
