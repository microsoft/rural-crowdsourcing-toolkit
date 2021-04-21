// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.database.models

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.google.gson.JsonObject

@Entity(
    tableName = "language_resource",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = ScenarioRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("scenario_id")),
            ForeignKey(
                entity = LanguageResourceRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("string_resource_id"))),
    indices = arrayOf(Index("scenario_id"), Index("string_resource_id")))
data class LanguageResourceRecord(
    @PrimaryKey var id: Int,
    var core: Boolean,
    var scenario_id: Int?,
    var string_resource_id: Int?,
    var type: LanguageResourceType,
    var list_resource: Boolean,
    var name: String,
    var description: String,
    var required: Boolean,
    var update_lrv_file: Boolean,
    var lrv_file_id: String?,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
