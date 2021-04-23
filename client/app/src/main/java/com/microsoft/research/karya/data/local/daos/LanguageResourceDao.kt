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
import com.microsoft.research.karya.data.model.karya.LanguageResourceRecord

@Dao
interface LanguageResourceDao : BasicDao<LanguageResourceRecord> {

  @Query("SELECT * FROM language_resource") suspend fun getAll(): List<LanguageResourceRecord>

  @Query("SELECT * FROM language_resource WHERE id == :id") suspend fun getById(id: Int): LanguageResourceRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: LanguageResourceRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<LanguageResourceRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
