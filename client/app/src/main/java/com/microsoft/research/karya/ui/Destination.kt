package com.microsoft.research.karya.ui

sealed class Destination {
  object Splash : Destination()
  object AccessCodeFlow : Destination()
  object UserSelection : Destination()
  object LoginFlow : Destination()
  object HomeScreen : Destination()
  object ProfileFragment : Destination()
}
