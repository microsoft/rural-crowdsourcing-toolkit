package com.microsoft.research.karya.ui.onboarding.login.profile

import com.microsoft.research.karya.ui.Destination

sealed class ProfileEffects {
  data class Navigate(val destination: Destination) : ProfileEffects()
}
