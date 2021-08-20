// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya.modelsExtra

import com.microsoft.research.karya.data.model.karya.enums.ScenarioType

data class TaskInfo(
  val taskID: String,
  val taskName: String,
  val scenarioName: ScenarioType,
  val taskStatus: TaskStatus,
  val isGradeCard: Boolean,
)
