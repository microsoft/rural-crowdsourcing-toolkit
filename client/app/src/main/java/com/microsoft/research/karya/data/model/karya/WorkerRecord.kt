// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import com.google.gson.JsonObject

@Entity(
    tableName = "worker"
    //TODO: Add Foreign Keys if required after freezing schema
)

data class WorkerRecord(
    @PrimaryKey
    var id: String,
    var local_id: String,
    var box_id: Int,
    var creation_code: String,
    var auth_provider: AuthProviderType?,
    var username: String?,
    var salt: String?,
    var passwd_hash: String?,
    var phone_number: String?,
    var email: String?,
    var oauth_id: String?,
    var id_token: String?,
    var full_name: String?,
    var profile_picture: String?,
    var age: String?,
    var gender: String?,
    var app_language: Int?,
    var last_sent_to_box_at: String,
    var last_received_from_box_at: String,
    var last_sent_to_server_at: String,
    var last_received_from_server_at: String,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
