package com.microsoft.research.karya.data.model.karya.modelsExtra

import com.google.gson.JsonElement

data class AssignmentReport(
  val task_id: String,
  val report: JsonElement?
)
