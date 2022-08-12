package com.microsoft.research.karya.ui.onboarding.login.profile

import com.microsoft.research.karya.ui.onboarding.login.phone.PhoneNumberUiState

sealed class ProfileUiState {
  data class Error(val throwable: Throwable) : ProfileUiState()
  object Empty : ProfileUiState()
  data class Initial(val profileData: ProfileData) : ProfileUiState()
  object Loading : ProfileUiState()
  object Success : ProfileUiState()
}

data class ProfileData(val name: String?, val gender: Gender?, val yob: String?)

enum class Gender {
  MALE,
  FEMALE
}
