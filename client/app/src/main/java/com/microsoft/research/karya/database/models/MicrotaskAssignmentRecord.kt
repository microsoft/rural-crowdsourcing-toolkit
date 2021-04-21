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
    tableName = "microtask_assignment",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = MicrotaskRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("microtask_id")),
            ForeignKey(
                entity = WorkerRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("worker_id")),
            ForeignKey(
                entity = KaryaFileRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("output_file_id"))),
    indices = arrayOf(Index("microtask_id"), Index("worker_id"), Index("output_file_id")))
data class MicrotaskAssignmentRecord(
    @PrimaryKey var id: String,
    var local_id: String,
    var box_id: Int,
    var microtask_id: String,
    var worker_id: String,
    var deadline: String?,
    var status: MicrotaskAssignmentStatus,
    var completed_at: String?,
    var output: JsonObject,
    var output_file_id: String?,
    var credits: Float?,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
