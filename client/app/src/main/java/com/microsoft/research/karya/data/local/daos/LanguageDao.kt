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
import com.microsoft.research.karya.data.model.karya.LanguageRecord

@Dao
interface LanguageDao : BasicDao<LanguageRecord> {

  @Query("SELECT * FROM language") suspend fun getAll(): List<LanguageRecord>

  @Query("SELECT * FROM language WHERE id == :id") suspend fun getById(id: Int): LanguageRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: LanguageRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<LanguageRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
