package com.microsoft.research.karya.ui.onboarding.login.otp

sealed class OTPDestination {
  object ProfilePicSelection : OTPDestination()
  object GenderSelection : OTPDestination()
  object AgeSelection : OTPDestination()
  object Dashboard : OTPDestination()
}
