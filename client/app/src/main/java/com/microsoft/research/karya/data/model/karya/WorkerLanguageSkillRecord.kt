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
    tableName = "worker_language_skill",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = WorkerRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("worker_id")),
            ForeignKey(
                entity = LanguageRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("language_id"))),
    indices = arrayOf(Index("worker_id"), Index("language_id")))
data class WorkerLanguageSkillRecord(
    @PrimaryKey var id: String,
    var local_id: String,
    var box_id: Int,
    var worker_id: String,
    var language_id: Int,
    var can_speak: Boolean,
    var can_type: Boolean,
    var can_read: Boolean,
    var can_listen: Boolean,
    var speak_score: Float?,
    var type_score: Float?,
    var read_score: Float?,
    var listen_score: Float?,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String,
)
