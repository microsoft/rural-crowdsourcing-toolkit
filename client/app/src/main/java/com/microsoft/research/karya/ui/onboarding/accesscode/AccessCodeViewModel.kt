package com.microsoft.research.karya.ui.onboarding.accesscode

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@HiltViewModel
class AccessCodeViewModel
@Inject
constructor(private val workerRepository: WorkerRepository, private val authManager: AuthManager) : ViewModel() {

  private val _accessCodeUiState: MutableStateFlow<AccessCodeUiState> = MutableStateFlow(AccessCodeUiState.Initial)
  val accessCodeUiState = _accessCodeUiState.asStateFlow()

  private val _accessCodeEffects: MutableSharedFlow<AccessCodeEffects> = MutableSharedFlow()
  val accessCodeEffects = _accessCodeEffects.asSharedFlow()

  fun checkAccessCode(accessCode: String) {
    workerRepository
      .verifyAccessCode(accessCode)
      .onStart { _accessCodeUiState.value = AccessCodeUiState.Loading }
      .onEach { worker ->
        createWorker(accessCode, worker)
        authManager.updateLoggedInWorker(worker.id)
        _accessCodeUiState.value = AccessCodeUiState.Success(worker.language)
        _accessCodeEffects.emit(AccessCodeEffects.Navigate)
      }
      .catch { exception -> _accessCodeUiState.value = AccessCodeUiState.Error(exception) }
      .launchIn(viewModelScope)
  }

  private fun createWorker(accessCode: String, workerRecord: WorkerRecord) {
    val dbWorker = workerRecord.copy(accessCode = accessCode)

    viewModelScope.launch { workerRepository.upsertWorker(dbWorker) }
  }
}
