package com.microsoft.research.karya.ui.age

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.AgeGroup
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import com.microsoft.research.karya.data.repo.WorkerRepository
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class SelectAgeViewModel(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _selectAgeUiState: MutableStateFlow<SelectAgeUiState> = MutableStateFlow(SelectAgeUiState.Initial)
  val selectAgeUiState = _selectAgeUiState.asStateFlow()

  private val _selectAgeEffects: MutableSharedFlow<SelectAgeEffects> = MutableSharedFlow()
  val selectAgeEffects = _selectAgeEffects.asSharedFlow()

  fun updateWorkerAge(currentAge: AgeGroup) {
    viewModelScope.launch {
      val worker = authManager.fetchLoggedInWorker()
      val registerOrUpdateWorkerRequest = RegisterOrUpdateWorkerRequest(currentAge.name, worker.gender)

      checkNotNull(worker.idToken)

      workerRepository
        .updateWorker(worker.idToken, worker.accessCode, registerOrUpdateWorkerRequest)
        .onEach { workerRecord ->
          workerRepository.upsertWorker(workerRecord)
          _selectAgeUiState.value = SelectAgeUiState.Success
          _selectAgeEffects.emit(SelectAgeEffects.Navigate)
        }
        .catch { e -> }
        .launchIn(viewModelScope)
    }
  }
}
