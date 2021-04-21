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
    tableName = "task",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = LanguageRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("language_id")),
            ForeignKey(
                entity = ScenarioRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("scenario_id")),
            ForeignKey(
                entity = KaryaFileRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("input_file_id")),
            ForeignKey(
                entity = KaryaFileRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("output_file_id"))),
    indices =
        arrayOf(
            Index("language_id"),
            Index("scenario_id"),
            Index("input_file_id"),
            Index("output_file_id")))
data class TaskRecord(
    @PrimaryKey var id: String,
    var language_id: Int,
    var scenario_id: Int,
    var name: String,
    var description: String,
    var primary_language_name: String,
    var primary_language_description: String,
    var params: JsonObject,
    var errors: JsonObject,
    var actions: JsonObject,
    var input_file_id: String?,
    var output_file_id: String?,
    var budget: Float?,
    var deadline: String?,
    var assignment_granularity: AssignmentGranularityType,
    var group_assignment_order: AssignmentOrderType,
    var microtask_assignment_order: AssignmentOrderType,
    var status: TaskStatus,
    var created_at: String,
    var last_updated_at: String
)
