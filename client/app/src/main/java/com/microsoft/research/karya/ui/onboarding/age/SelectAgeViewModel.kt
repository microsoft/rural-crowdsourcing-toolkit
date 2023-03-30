package com.microsoft.research.karya.ui.onboarding.age

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@HiltViewModel
class SelectAgeViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _selectAgeUiState: MutableStateFlow<SelectAgeUiState> = MutableStateFlow(SelectAgeUiState.Initial)
  val selectAgeUiState = _selectAgeUiState.asStateFlow()

  private val _selectAgeEffects: MutableSharedFlow<SelectAgeEffects> = MutableSharedFlow()
  val selectAgeEffects = _selectAgeEffects.asSharedFlow()

  fun updateWorkerYOB(yob: String) {
    viewModelScope.launch {
      _selectAgeUiState.value = SelectAgeUiState.Loading

      val worker = authManager.getLoggedInWorker()
      checkNotNull(worker.idToken)
      checkNotNull(worker.gender)

      val registerOrUpdateWorkerRequest = RegisterOrUpdateWorkerRequest(yob, worker.gender)

      workerRepository
        .updateWorker(worker.idToken, worker.accessCode, registerOrUpdateWorkerRequest)
        .onEach { workerRecord ->
          workerRepository.upsertWorker(worker.copy(yob = workerRecord.yob))
          _selectAgeUiState.value = SelectAgeUiState.Success
          _selectAgeEffects.emit(SelectAgeEffects.Navigate)
        }
        .catch { e -> _selectAgeUiState.value = SelectAgeUiState.Error(e) }
        .launchIn(viewModelScope)
    }
  }
}
