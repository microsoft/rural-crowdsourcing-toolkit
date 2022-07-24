// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya.modelsExtra

import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.enums.ScenarioType

data class TaskInfo(
  val taskID: String,
  val taskName: String,
  val taskInstruction: String?,
  val scenarioName: ScenarioType,
  val taskStatus: TaskStatus,
  val isGradeCard: Boolean,
  val reportSummary: JsonObject?,
)
