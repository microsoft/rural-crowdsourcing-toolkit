package com.microsoft.research.karya.ui.onboarding.gender

sealed class SelectGenderUiState {
  data class Error(val throwable: Throwable) : SelectGenderUiState()
  data class Success(val gender: Gender) : SelectGenderUiState()
  object Initial : SelectGenderUiState()
  object Loading : SelectGenderUiState()
}
