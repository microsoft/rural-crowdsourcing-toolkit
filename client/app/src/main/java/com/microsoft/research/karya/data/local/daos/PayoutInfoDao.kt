// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.data.model.karya.PayoutInfoRecord

@Dao
interface PayoutInfoDao : BasicDao<PayoutInfoRecord> {

  @Query("SELECT * FROM payout_info") suspend fun getAll(): List<PayoutInfoRecord>

  @Query("SELECT * FROM payout_info WHERE id == :id")
  suspend fun getById(id: String): PayoutInfoRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: PayoutInfoRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<PayoutInfoRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
