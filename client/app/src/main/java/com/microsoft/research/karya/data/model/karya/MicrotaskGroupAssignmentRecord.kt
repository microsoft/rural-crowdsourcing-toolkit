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
    tableName = "microtask_group_assignment",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = MicrotaskGroupRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("microtask_group_id")),
            ForeignKey(
                entity = WorkerRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("worker_id"))),
    indices = arrayOf(Index("microtask_group_id"), Index("worker_id")))
data class MicrotaskGroupAssignmentRecord(
    @PrimaryKey var id: String,
    var local_id: String,
    var box_id: Int,
    var microtask_group_id: String,
    var worker_id: String,
    var status: MicrotaskGroupAssignmentStatus,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
