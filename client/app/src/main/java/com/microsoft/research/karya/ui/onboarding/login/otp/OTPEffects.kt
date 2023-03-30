package com.microsoft.research.karya.ui.onboarding.login.otp

import com.microsoft.research.karya.ui.Destination

sealed class OTPEffects {
  data class Navigate(val destination: Destination) : OTPEffects()
}
