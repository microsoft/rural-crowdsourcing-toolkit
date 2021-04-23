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
import com.microsoft.research.karya.data.model.karya.MicrotaskAssignmentRecord

@Dao
interface MicrotaskAssignmentDao : BasicDao<MicrotaskAssignmentRecord> {

  @Query("SELECT * FROM microtask_assignment") suspend fun getAll(): List<MicrotaskAssignmentRecord>

  @Query("SELECT * FROM microtask_assignment WHERE id == :id")
  suspend fun getById(id: String): MicrotaskAssignmentRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: MicrotaskAssignmentRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<MicrotaskAssignmentRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
