package com.microsoft.research.karya.ui.splashScreen

sealed class SplashDestination {
  object Splash : SplashDestination()
  object AccessCode : SplashDestination()
  object Registration : SplashDestination()
  object UserSelection : SplashDestination()
  object Dashboard : SplashDestination()
}
