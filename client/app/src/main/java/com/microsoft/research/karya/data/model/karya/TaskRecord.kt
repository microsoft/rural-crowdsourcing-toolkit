// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonElement
import com.microsoft.research.karya.data.model.karya.enums.ScenarioType
import com.microsoft.research.karya.data.model.karya.enums.TaskStatus

@Entity(tableName = "task")
data class TaskRecord(
  @PrimaryKey var id: String,
  var scenario_name: ScenarioType,
  var name: String,
  var description: String,
  var display_name: String,
  var params: JsonElement,
  var deadline: String?,
  var assignment_granularity: AssignmentGranularityType,
  var group_assignment_order: AssignmentOrderType,
  var microtask_assignment_order: AssignmentOrderType,
  var status: TaskStatus,
  var created_at: String,
  var last_updated_at: String
)
