// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.google.gson.JsonObject

@Entity(
  tableName = "microtask",
  foreignKeys =
    arrayOf(
      ForeignKey(entity = TaskRecord::class, parentColumns = arrayOf("id"), childColumns = arrayOf("task_id")),
      ForeignKey(
        entity = KaryaFileRecord::class,
        parentColumns = arrayOf("id"),
        childColumns = arrayOf("input_file_id")
      )
    ),
  indices = arrayOf(Index("task_id"), Index("group_id"), Index("input_file_id"))
)
data class MicrotaskRecord(
  @PrimaryKey var id: String,
  var task_id: String,
  var group_id: String?,
  var input: JsonObject,
  var input_file_id: String?,
  var deadline: String?,
  var credits: Float,
  var status: MicrotaskStatus,
  var output: JsonObject,
  var params: JsonObject,
  var created_at: String,
  var last_updated_at: String,
)
