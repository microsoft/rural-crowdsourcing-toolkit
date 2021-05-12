// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord

@Entity(tableName = "microtask_assignment")
data class MicroTaskAssignmentRecord(
  @PrimaryKey var id: String,
  var local_id: String,
  var box_id: String,
  var microtask_id: String,
  var task_id: String,
  var worker_id: String,
  var deadline: String?,
  var status: String,
  var completed_at: String?,
  var output: JsonObject?,
  var output_file_id: String?,
  var credits: Float?,
  var created_at: String,
  var last_updated_at: String,
)
