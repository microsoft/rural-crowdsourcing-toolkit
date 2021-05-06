package com.microsoft.research.karya.ui.login.phone

sealed class PhoneNumberUiState {
  data class Error(val throwable: Throwable) : PhoneNumberUiState()
  object Initial : PhoneNumberUiState()
  object Loading : PhoneNumberUiState()
  object Success : PhoneNumberUiState()
}
