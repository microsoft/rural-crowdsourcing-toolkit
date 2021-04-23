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
  tableName = "language_resource_value",
  foreignKeys =
    arrayOf(
      ForeignKey(entity = LanguageRecord::class, parentColumns = arrayOf("id"), childColumns = arrayOf("language_id")),
      ForeignKey(
        entity = LanguageResourceRecord::class,
        parentColumns = arrayOf("id"),
        childColumns = arrayOf("language_resource_id")
      )
    ),
  indices = arrayOf(Index("language_id"), Index("language_resource_id"))
)
data class LanguageResourceValueRecord(
  @PrimaryKey var id: Int,
  var language_id: Int,
  var language_resource_id: Int,
  var value: String,
  var valid: Boolean,
  var need_update: Boolean,
  var params: JsonObject,
  var created_at: String,
  var last_updated_at: String,
)
