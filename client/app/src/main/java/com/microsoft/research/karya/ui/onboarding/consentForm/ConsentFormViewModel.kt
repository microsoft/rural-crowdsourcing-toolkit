package com.microsoft.research.karya.ui.onboarding.consentForm

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ConsentFormViewModel
@Inject
constructor(private val workerRepository: WorkerRepository, private val authManager: AuthManager) :
  ViewModel() {

  private val _consentFormUiState: MutableStateFlow<ConsentFormUiState> =
    MutableStateFlow(ConsentFormUiState.Initial)
  val consentFormUiState = _consentFormUiState.asStateFlow()

  private val _consentFormEffects: MutableSharedFlow<ConsentFormEffects> = MutableSharedFlow()
  val consentFormEffects = _consentFormEffects.asSharedFlow()

  fun updateConsentFormStatus(isConsentProvided: Boolean) {
    viewModelScope.launch {
      _consentFormUiState.value = ConsentFormUiState.Loading

      val worker = authManager.fetchLoggedInWorker()
      val dbWorker = worker.copy(isConsentProvided = isConsentProvided)
      workerRepository.upsertWorker(dbWorker)

      _consentFormUiState.value = ConsentFormUiState.Success
      _consentFormEffects.emit(ConsentFormEffects.Navigate)
    }
  }
}
