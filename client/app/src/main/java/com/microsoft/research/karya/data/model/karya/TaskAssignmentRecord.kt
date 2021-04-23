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
    tableName = "task_assignment",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = TaskRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("task_id")),
            ForeignKey(
                entity = PolicyRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("policy_id"))),
    indices = arrayOf(Index("task_id"), Index("policy_id")))
data class TaskAssignmentRecord(
    @PrimaryKey var id: String,
    var task_id: String,
    var box_id: Int,
    var policy_id: Int,
    var deadline: String?,
    var status: TaskAssignmentStatus,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String,
)
