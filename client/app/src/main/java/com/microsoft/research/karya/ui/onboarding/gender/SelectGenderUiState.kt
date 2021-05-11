package com.microsoft.research.karya.ui.onboarding.gender

sealed class SelectGenderUiState {
  data class Error(val throwable: Throwable) : SelectGenderUiState()
  object Initial : SelectGenderUiState()
  object Loading : SelectGenderUiState()
  object Success : SelectGenderUiState()
}
