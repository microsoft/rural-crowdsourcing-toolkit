@file:Suppress("NAME_SHADOWING")

package com.microsoft.research.karya.ui.login.otp

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

@HiltViewModel
class OTPViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _otpUiState: MutableStateFlow<OTPUiState> = MutableStateFlow(OTPUiState.Initial)
  val otpUiState = _otpUiState.asStateFlow()

  private val _otpEffects: MutableSharedFlow<OTPEffects> = MutableSharedFlow()
  val otpEffects = _otpEffects.asSharedFlow()

  fun resendOTP() {
    viewModelScope.launch {
      val worker = authManager.fetchLoggedInWorker()
      // We updated the worker phone number during first otp call, let's reuse that
      checkNotNull(worker.phoneNumber)

      workerRepository
        .resendOTP(accessCode = worker.accessCode, phoneNumber = worker.phoneNumber)
        .onEach { _otpUiState.value = OTPUiState.Initial }
        .catch { throwable -> _otpUiState.value = OTPUiState.Error(throwable) }
        .collect()
    }
  }

  fun verifyOTP(otp: String) {
    viewModelScope.launch {
      val worker = authManager.fetchLoggedInWorker()
      // We updated the worker phone number during first otp call, let's reuse that
      checkNotNull(worker.phoneNumber)

      workerRepository
        .verifyOTP(accessCode = worker.accessCode, phoneNumber = worker.phoneNumber, otp)
        .onEach { worker ->
          updateWorker(worker)
          _otpUiState.value = OTPUiState.Success
          handleNavigation(worker)
        }
        .catch { throwable -> _otpUiState.value = OTPUiState.Error(throwable) }
        .collect()
    }
  }

  private suspend fun handleNavigation(worker: WorkerRecord) {
    val destination =
      when {
        worker.profilePicturePath.isNullOrEmpty() -> OTPDestination.ProfilePicSelection
        worker.gender.isNullOrEmpty() -> OTPDestination.GenderSelection
        worker.age.isNullOrEmpty() -> OTPDestination.AgeSelection
        else -> OTPDestination.Dashboard
      }

    _otpEffects.emit(OTPEffects.Navigate(destination))
  }

  private suspend fun updateWorker(worker: WorkerRecord) {
    workerRepository.upsertWorker(worker)
  }
}
