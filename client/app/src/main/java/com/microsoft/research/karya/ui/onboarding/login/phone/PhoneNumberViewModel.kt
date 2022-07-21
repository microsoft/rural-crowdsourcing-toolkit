package com.microsoft.research.karya.ui.onboarding.login.phone

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PhoneNumberViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _phoneNumberUiState: MutableStateFlow<PhoneNumberUiState> =
    MutableStateFlow(PhoneNumberUiState.Initial)
  val phoneNumberUiState = _phoneNumberUiState.asStateFlow()

  private val _phoneNumberEffects: MutableSharedFlow<PhoneNumberEffects> = MutableSharedFlow()
  val phoneNumberEffects = _phoneNumberEffects.asSharedFlow()

  private val _workerAccessCode: MutableStateFlow<String> = MutableStateFlow("")
  val workerAccessCode = _workerAccessCode.asStateFlow()

  init {
    viewModelScope.launch {
      val worker = authManager.getLoggedInWorker()
      _workerAccessCode.value = worker.accessCode
    }
  }

  fun sendOTP(phoneNumber: String) {
    viewModelScope.launch {
      _phoneNumberUiState.value = PhoneNumberUiState.Loading

      val worker = authManager.getLoggedInWorker()
      // Update worker's phone number in the DB.
      // We don't care if it is correct or not, if it's incorrect we can update it later when user
      // requests the otp again.
      val dbWorker = worker.copy(phoneNumber = phoneNumber)
      updateWorker(dbWorker)

      workerRepository
        .getOTP(accessCode = dbWorker.accessCode, phoneNumber = phoneNumber)
        .onEach {
          _phoneNumberUiState.value = PhoneNumberUiState.Success
          _phoneNumberEffects.emit(PhoneNumberEffects.Navigate)
        }
        .catch { throwable -> _phoneNumberUiState.value = PhoneNumberUiState.Error(throwable) }
        .collect()
    }
  }

  private suspend fun updateWorker(worker: WorkerRecord) {
    workerRepository.upsertWorker(worker)
  }
}
