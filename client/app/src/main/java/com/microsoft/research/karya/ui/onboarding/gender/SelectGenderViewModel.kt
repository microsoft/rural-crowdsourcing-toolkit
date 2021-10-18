package com.microsoft.research.karya.ui.onboarding.gender

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
class SelectGenderViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _selectGenderUiState: MutableStateFlow<SelectGenderUiState> =
    MutableStateFlow(SelectGenderUiState.Initial)
  val selectGenderUiState = _selectGenderUiState.asStateFlow()

  private val _selectGenderEffects: MutableSharedFlow<SelectGenderEffects> = MutableSharedFlow()
  val selectGenderEffects = _selectGenderEffects.asSharedFlow()

  private var selectedGender: Gender = Gender.NOT_SPECIFIED

  fun updateWorkerGender() {
    viewModelScope.launch {
      _selectGenderUiState.value = SelectGenderUiState.Loading

      val worker = authManager.getLoggedInWorker()
      val newWorker = worker.copy(gender = selectedGender.gender)

      checkNotNull(worker.idToken)

      try {
        workerRepository.upsertWorker(newWorker)
        _selectGenderUiState.value = SelectGenderUiState.Success(selectedGender)
        _selectGenderEffects.emit(SelectGenderEffects.Navigate)
      } catch (throwable: Throwable) {
        _selectGenderUiState.value = SelectGenderUiState.Error(throwable)
      }
    }
  }

  fun setGender(gender: Gender) {
    selectedGender = gender
    _selectGenderUiState.value = SelectGenderUiState.Success(gender)
  }
}
