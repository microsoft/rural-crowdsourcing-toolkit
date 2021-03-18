// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

package com.microsoft.research.karya.database.models
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonObject

@Entity(tableName = "language")

data class LanguageRecord(
    @PrimaryKey
    var id: Int,
    var name: String,
    var primary_language_name: String,
    var locale: String,
    var iso_639_3_code: String,
    var script: String?,
    var string_support: Boolean,
    var file_support: Boolean,
    var list_support: Boolean,
    var update_lrv_file: Boolean,
    var lrv_file_id: String?,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
