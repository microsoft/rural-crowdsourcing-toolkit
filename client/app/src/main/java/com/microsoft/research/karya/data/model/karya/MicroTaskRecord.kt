// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskStatus

@Entity(tableName = "microtask")
data class MicroTaskRecord(
  @SerializedName("id")
  @PrimaryKey
  val id: String,
  @SerializedName("created_at")
  val createdAt: String,
  @SerializedName("credits")
  val credits: Int,
  @SerializedName("deadline")
  val deadline: String?,
  @SerializedName("extras")
  val extras: String?,
  @SerializedName("group_id")
  val groupId: String?,
  @SerializedName("input")
  val input: Input?,
  @SerializedName("input_file_id")
  val inputFileId: Any?,
  @SerializedName("last_updated_at")
  val lastUpdatedAt: String,
  @SerializedName("output")
  val output: Any?,
  @SerializedName("status")
  val status: String,
  @SerializedName("task_id")
  val taskId: String
) {
  data class Input(
    @SerializedName("data")
    val `data`: Data
  ) {
    data class Data(
      @SerializedName("sentence")
      val sentence: String
    )
  }
}