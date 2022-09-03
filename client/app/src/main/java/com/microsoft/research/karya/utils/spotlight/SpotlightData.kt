package com.microsoft.research.karya.utils.spotlight

import android.view.View
import com.takusemba.spotlight.shape.Shape

data class SpotlightData(
  val anchor: View,
  val shape: Shape,
  val overlay: View,
  val audioFile: String
)
