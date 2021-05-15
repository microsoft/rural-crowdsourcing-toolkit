// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonElement

@Entity(tableName = "scenario")
data class ScenarioRecord(
  @PrimaryKey var id: Int,
  var name: String,
  var full_name: String,
  var description: String,
  var task_params: JsonElement,
  var assignment_granularity: AssignmentGranularityType,
  var group_assignment_order: AssignmentOrderType,
  var microtask_assignment_order: AssignmentOrderType,
  var synchronous_validation: Boolean,
  var enabled: Boolean,
  var skills: JsonElement,
  var params: JsonElement,
  var created_at: String,
  var last_updated_at: String,
)
