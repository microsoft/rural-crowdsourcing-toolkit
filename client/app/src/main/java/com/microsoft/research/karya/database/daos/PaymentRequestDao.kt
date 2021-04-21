// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.database.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.database.models.PaymentRequestRecord

@Dao
interface PaymentRequestDao : BasicDao<PaymentRequestRecord> {

  @Query("SELECT * FROM payment_request") suspend fun getAll(): List<PaymentRequestRecord>

  @Query("SELECT * FROM payment_request WHERE id == :id")
  suspend fun getById(id: String): PaymentRequestRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: PaymentRequestRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<PaymentRequestRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
