// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.database.models

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonObject

@Entity(tableName = "payout_method")
data class PayoutMethodRecord(
    @PrimaryKey var id: Int,
    var name: String,
    var description: String,
    var required_info: JsonObject,
    var enabled: Boolean,
    var created_at: String,
    var last_updated_at: String
)
