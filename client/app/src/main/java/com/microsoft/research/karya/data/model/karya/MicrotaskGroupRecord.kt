// TODO: REMOVE THIS RESOURCE
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
    tableName = "microtask_group", foreignKeys = arrayOf(
        ForeignKey(
            entity = TaskRecord::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("task_id")
        )
    ), indices = arrayOf(Index("task_id"))
)

data class MicrotaskGroupRecord(
    @PrimaryKey
    var id: String,
    var task_id: String,
    var microtask_assignment_order: AssignmentOrderType,
    var status: MicrotaskGroupStatus,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
