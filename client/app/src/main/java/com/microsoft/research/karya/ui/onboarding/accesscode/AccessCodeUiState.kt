package com.microsoft.research.karya.ui.onboarding.accesscode

sealed class AccessCodeUiState {
  data class Error(val throwable: Throwable) : AccessCodeUiState()
  data class Success(val languageCode: String) : AccessCodeUiState()
  object Initial : AccessCodeUiState()
  object Loading : AccessCodeUiState()
}
