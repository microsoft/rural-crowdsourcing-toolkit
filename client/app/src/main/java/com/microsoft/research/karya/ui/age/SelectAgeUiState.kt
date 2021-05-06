package com.microsoft.research.karya.ui.age

sealed class SelectAgeUiState {
  data class Error(val throwable: Throwable) : SelectAgeUiState()
  object Initial : SelectAgeUiState()
  object Loading : SelectAgeUiState()
  object Success : SelectAgeUiState()
}
