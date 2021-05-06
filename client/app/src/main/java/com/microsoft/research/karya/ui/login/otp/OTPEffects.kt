package com.microsoft.research.karya.ui.login.otp

sealed class OTPEffects {
  data class Navigate(val data: OTPDestination) : OTPEffects()
}
