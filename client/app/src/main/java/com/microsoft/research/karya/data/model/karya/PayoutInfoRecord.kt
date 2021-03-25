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
    tableName = "payout_info", foreignKeys = arrayOf(
    ForeignKey(
            entity = WorkerRecord::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("worker_id")
        ), ForeignKey(
            entity = PayoutMethodRecord::class,
            parentColumns = arrayOf("id"),
            childColumns = arrayOf("method_id")
        )
    ), indices = arrayOf(Index("worker_id"), Index("method_id"))
)

data class PayoutInfoRecord(
    @PrimaryKey
    var id: String,
    var local_id: String,
    var box_id: Int,
    var worker_id: String,
    var method_id: Int,
    var info: JsonObject,
    var status: PayoutInfoStatus,
    var enabled: Boolean,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String
)
