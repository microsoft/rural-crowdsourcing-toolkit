package com.microsoft.research.karya.ui.scenarios.speechData

import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel

class SpeechDataMainViewModel(
  taskId:String,
  completedMta: Int,
  incompleteMta: Int)
  : BaseMTRendererViewModel(
  taskId = taskId,
  completedMta = completedMta,
  incompleteMta = incompleteMta) {

  override fun setupMicrotask() {
  }

  override fun cleanupOnStop() {
    TODO("Not yet implemented")
  }
}