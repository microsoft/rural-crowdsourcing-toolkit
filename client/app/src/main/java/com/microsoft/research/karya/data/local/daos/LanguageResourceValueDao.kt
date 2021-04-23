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
import com.microsoft.research.karya.data.model.karya.LanguageResourceValueRecord

@Dao
interface LanguageResourceValueDao : BasicDao<LanguageResourceValueRecord> {

  @Query("SELECT * FROM language_resource_value") suspend fun getAll(): List<LanguageResourceValueRecord>

  @Query("SELECT * FROM language_resource_value WHERE id == :id")
  suspend fun getById(id: Int): LanguageResourceValueRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: LanguageResourceValueRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<LanguageResourceValueRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
