package com.microsoft.research.karya.data.model.karya.modelsExtra

data class PerformanceSummary(
  val recordingAccuracy: Float,
  val transcriptionAccuracy: Float,
  val typingAccuracy: Float,
  val imageAnnotationAccuracy: Float
)
