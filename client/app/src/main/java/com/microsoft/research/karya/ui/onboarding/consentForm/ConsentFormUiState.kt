package com.microsoft.research.karya.ui.onboarding.consentForm

sealed class ConsentFormUiState {
  data class Error(val throwable: Throwable) : ConsentFormUiState()
  object Initial : ConsentFormUiState()
  object Loading : ConsentFormUiState()
  object Success : ConsentFormUiState()
}
