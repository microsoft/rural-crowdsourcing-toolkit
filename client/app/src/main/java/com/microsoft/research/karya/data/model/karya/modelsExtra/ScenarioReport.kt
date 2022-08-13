package com.microsoft.research.karya.data.model.karya.modelsExtra

import com.google.gson.JsonElement
import com.microsoft.research.karya.data.model.karya.enums.ScenarioType

data class ScenarioReport(
  val scenario_name: ScenarioType,
  val report: JsonElement?
)
