// TODO: REMOVE THIS RESOURCE
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
  tableName = "policy",
  foreignKeys =
    arrayOf(
      ForeignKey(entity = ScenarioRecord::class, parentColumns = arrayOf("id"), childColumns = arrayOf("scenario_id"))
    ),
  indices = arrayOf(Index("scenario_id"))
)
data class PolicyRecord(
  @PrimaryKey var id: Int,
  var scenario_id: Int,
  var name: String,
  var description: String,
  var params: JsonObject,
  var created_at: String,
  var last_updated_at: String,
)
