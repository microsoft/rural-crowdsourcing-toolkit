package com.microsoft.research.karya.ui.registration

import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.IncorrectAccessCodeException
import com.microsoft.research.karya.data.exceptions.IncorrectOtpException
import com.microsoft.research.karya.data.exceptions.PhoneNumberAlreadyUsedException
import com.microsoft.research.karya.data.exceptions.UnknownException
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.AgeGroup
import com.microsoft.research.karya.data.model.karya.enums.OtpSendState
import com.microsoft.research.karya.data.model.karya.enums.OtpVerifyState
import com.microsoft.research.karya.data.model.karya.enums.RegisterWorkerState
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import java.io.FileOutputStream
import javax.inject.Inject
import kotlin.properties.Delegates
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

@HiltViewModel
class RegistrationViewModel
@Inject
constructor(
  private val workerRepository: WorkerRepository,
  private val authManager: AuthManager,
) : ViewModel() {

  private val _openDashBoardFromOTP = MutableLiveData(false)
  val openDashBoardFromOTP: LiveData<Boolean>
    get() = _openDashBoardFromOTP

  private val _openProfilePictureFragmentFromOTP = MutableLiveData(false)
  val openProfilePictureFragmentFromOTP: LiveData<Boolean>
    get() = _openProfilePictureFragmentFromOTP

  private val _openSelectGenderFragmentFromProfilePicture = MutableLiveData(false)
  val openSelectGenderFragmentFromProfilePicture: LiveData<Boolean>
    get() = _openSelectGenderFragmentFromProfilePicture

  private val _currOtpVerifyState = MutableLiveData(OtpVerifyState.NOT_ENTERED)
  val currOtpVerifyState: LiveData<OtpVerifyState>
    get() = _currOtpVerifyState

  private val _currOtpSendState = MutableLiveData(OtpSendState.NOT_SENT)
  val currOtpSendState: LiveData<OtpSendState>
    get() = _currOtpSendState

  private val _currOtpResendState = MutableLiveData(OtpSendState.NOT_SENT)
  val currOtpResendState: LiveData<OtpSendState>
    get() = _currOtpResendState

  private val _currRegisterState = MutableLiveData(RegisterWorkerState.NOT_STARTED)
  val currRegisterState: LiveData<RegisterWorkerState>
    get() = _currRegisterState

  private val _loadImageBitmap = MutableLiveData(false)
  val loadImageBitmap: LiveData<Boolean>
    get() = _loadImageBitmap

  private val _idTokenLiveData = MutableLiveData("")
  val idTokenLiveData: LiveData<String>
    get() = _idTokenLiveData

  var phoneNumberFragmentErrorId by Delegates.notNull<Int>()
  var otpFragmentErrorId by Delegates.notNull<Int>()
  var selectAgeGroupFragmentErrorId by Delegates.notNull<Int>()

  var workerPhoneNumber = ""

  private suspend fun updateWorker(workerRecord: WorkerRecord) {
    workerRepository.upsertWorker(workerRecord)
  }

  private fun sendGenerateOtpError(e: Throwable) {
    phoneNumberFragmentErrorId =
      when (e) {
        is PhoneNumberAlreadyUsedException -> R.string.s_phone_number_already_used
        is IncorrectAccessCodeException -> R.string.s_invalid_creation_code // this case should never happen
        is UnknownException -> R.string.s_unknown_error
        else -> R.string.s_unknown_error
      }
    _currOtpSendState.value = OtpSendState.FAIL
  }

  private fun sendResendOtpError(e: Throwable) {
    otpFragmentErrorId =
      when (e) {
        is UnknownError -> R.string.s_unknown_error
        else -> R.string.s_unknown_error
      }
    _currOtpResendState.value = OtpSendState.FAIL
  }

  private fun sendVerifyOtpError(e: Throwable) {
    otpFragmentErrorId =
      when (e) {
        is IncorrectOtpException -> R.string.s_invalid_otp
        is UnknownError -> R.string.s_unknown_error
        else -> R.string.s_unknown_error
      }
    _currOtpVerifyState.value = OtpVerifyState.FAIL
  }

  fun afterNavigateToProfilePicture() {
    _openProfilePictureFragmentFromOTP.value = false
    _currOtpResendState.value = OtpSendState.NOT_SENT
    _currOtpVerifyState.value = OtpVerifyState.NOT_ENTERED
  }

  fun afterNavigateToDashboard() {
    _openDashBoardFromOTP.value = false
    _currOtpResendState.value = OtpSendState.NOT_SENT
    _currOtpVerifyState.value = OtpVerifyState.NOT_ENTERED
  }

  fun resetOtpSendState() {
    _currOtpSendState.value = OtpSendState.NOT_SENT
  }

  /** Methods for Profile Picture Fragment ==================================== */

  /** Handle submit profile picture click. */
  fun submitProfilePicture(profilePic: Bitmap?, imageFolder: String) {
    WorkerInformation.profile_picture = profilePic
    val fileName = "pp.png"
    val out = FileOutputStream("$imageFolder/$fileName")
    profilePic!!.compress(Bitmap.CompressFormat.PNG, 100, out)
    _openSelectGenderFragmentFromProfilePicture.value = true
  }

  fun rotateRight(profilePic: Bitmap): Bitmap {
    val matrix = Matrix()
    matrix.postRotate(90.toFloat())
    val rotated = Bitmap.createBitmap(profilePic, 0, 0, profilePic.width, profilePic.height, matrix, true)
    _loadImageBitmap.value = true
    return rotated
  }

  fun afterNavigateToSelectGender() {
    _openSelectGenderFragmentFromProfilePicture.value = false
  }

  fun afterLoadingBitmap() {
    _loadImageBitmap.value = false
  }

  private fun sendRegisterWorkerError(e: Throwable) {
    selectAgeGroupFragmentErrorId =
      when (e) {
        is IncorrectAccessCodeException -> R.string.s_invalid_creation_code
        is UnknownError -> R.string.s_unknown_error
        else -> R.string.s_unknown_error
      }
    _currRegisterState.value = RegisterWorkerState.FAILURE
  }

  fun updateWorkerAge(currentAge: AgeGroup) {
    viewModelScope.launch {
      val worker = authManager.fetchLoggedInWorker()
      val registerOrUpdateWorkerRequest = RegisterOrUpdateWorkerRequest(currentAge.name, worker.gender)

      checkNotNull(worker.idToken)

      workerRepository
        .updateWorker(worker.idToken, worker.accessCode, registerOrUpdateWorkerRequest)
        .onEach { workerRecord ->
          workerRepository.upsertWorker(workerRecord)
          _currRegisterState.value = RegisterWorkerState.SUCCESS
        }
        .catch { e -> sendRegisterWorkerError(e) }
        .launchIn(viewModelScope)
    }
  }

  fun updateWorkerGender(gender: String) {
    viewModelScope.launch {
      val worker = authManager.fetchLoggedInWorker()
      val registerOrUpdateWorkerRequest = RegisterOrUpdateWorkerRequest(worker.yob ?: "", gender)

      checkNotNull(worker.idToken)

      workerRepository
        .updateWorker(worker.idToken, worker.accessCode, registerOrUpdateWorkerRequest)
        .onEach { workerRecord ->
          workerRepository.upsertWorker(workerRecord)
          _currRegisterState.value = RegisterWorkerState.SUCCESS
        }
        .catch { e -> sendRegisterWorkerError(e) }
        .launchIn(viewModelScope)
    }
  }
}
