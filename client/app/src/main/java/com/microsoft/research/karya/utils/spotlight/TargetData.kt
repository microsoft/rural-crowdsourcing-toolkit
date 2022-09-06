package com.microsoft.research.karya.utils.spotlight

import android.graphics.PointF
import android.media.MediaPlayer
import android.view.View
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.takusemba.spotlight.shape.Shape

data class TargetData(
  val shape: Shape,
  val overlayRes: Int,
  val audio: AssistantAudio,
  val uiCue: () -> Unit = {},
  val onCompletionListener: (player: MediaPlayer) -> Unit = {}
) {
  var anchorView: View? = null
  var anchorFloat: PointF? = null

  constructor(
    anchor: View,
    shape: Shape,
    overlayRes: Int,
    audio: AssistantAudio,
    uiCue: () -> Unit = {},
    onCompletionListener: (player: MediaPlayer) -> Unit = {}
  ): this(shape, overlayRes, audio, uiCue, onCompletionListener) {
    this.anchorView = anchor
  }

  constructor(
    anchor: PointF,
    shape: Shape,
    overlayRes: Int,
    audio: AssistantAudio,
    uiCue: () -> Unit = {},
    onCompletionListener: (player: MediaPlayer) -> Unit = {}
  ): this(shape, overlayRes, audio, uiCue, onCompletionListener) {
    this.anchorFloat = anchor
  }

}
