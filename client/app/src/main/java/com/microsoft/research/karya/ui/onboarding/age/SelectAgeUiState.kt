package com.microsoft.research.karya.ui.onboarding.age

sealed class SelectAgeUiState {
  data class Error(val throwable: Throwable) : SelectAgeUiState()
  object Initial : SelectAgeUiState()
  object Loading : SelectAgeUiState()
  object Success : SelectAgeUiState()
}
