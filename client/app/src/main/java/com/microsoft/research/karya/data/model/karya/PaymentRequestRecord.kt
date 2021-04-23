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
import com.microsoft.research.karya.data.model.karya.enums.PaymentRequestStatus

@Entity(
    tableName = "payment_request",
    foreignKeys =
        arrayOf(
            ForeignKey(
                entity = PayoutInfoRecord::class,
                parentColumns = arrayOf("id"),
                childColumns = arrayOf("payout_info_id"))),
    indices = arrayOf(Index("payout_info_id")))
data class PaymentRequestRecord(
    @PrimaryKey var id: String,
    var local_id: String,
    var box_id: Int,
    var payout_info_id: String,
    var amount: Int,
    var status: PaymentRequestStatus,
    var reference: String?,
    var params: JsonObject,
    var created_at: String,
    var last_updated_at: String,
)
