package com.microsoft.research.karya.utils.spotlight

import android.media.MediaPlayer
import android.view.View
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.takusemba.spotlight.shape.Shape

data class TargetData(
  val anchor: View,
  val shape: Shape,
  val overlayRes: Int,
  val audio: AssistantAudio,
  val uiCue: () -> Unit = {},
  val onCompletionListener: (player: MediaPlayer) -> Unit = {}
  )
