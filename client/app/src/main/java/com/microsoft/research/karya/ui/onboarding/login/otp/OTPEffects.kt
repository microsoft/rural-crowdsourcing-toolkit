package com.microsoft.research.karya.ui.onboarding.login.otp

import com.microsoft.research.karya.ui.Destination

sealed class OTPEffects {
  object NavigateToProfile : OTPEffects()
  object NavigateToHomeScreen: OTPEffects()
}
