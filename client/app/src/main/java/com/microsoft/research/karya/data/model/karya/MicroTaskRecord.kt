// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskStatus

@Entity(tableName = "microtask")
data class MicroTaskRecord(
  @PrimaryKey var id: String,
  @SerializedName("task_id")
  var task_id: String,
  @SerializedName("group_id")
  var group_id: String?,
  @SerializedName("input")
  var input: JsonElement,
  @SerializedName("input_file_id")
  var input_file_id: String?,
  @SerializedName("deadline")
  var deadline: String?,
  @SerializedName("credits")
  var credits: Int,
  @SerializedName("output")
  var output: JsonElement,
  @SerializedName("created_at")
  var created_at: String,
  @SerializedName("last_updated_at")
  var last_updated_at: String,
)
