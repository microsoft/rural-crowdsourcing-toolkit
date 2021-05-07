package com.microsoft.research.karya.ui.onboarding.profile

sealed class ProfileUiState {
  data class Success(val data: String?) : ProfileUiState()
  data class Error(val throwable: Throwable) : ProfileUiState()
  object Initial : ProfileUiState()
  object Loading : ProfileUiState()
}
