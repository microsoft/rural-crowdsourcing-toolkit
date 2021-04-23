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
import com.microsoft.research.karya.data.model.karya.MicrotaskGroupAssignmentRecord

@Dao
interface MicrotaskGroupAssignmentDao : BasicDao<MicrotaskGroupAssignmentRecord> {

  @Query("SELECT * FROM microtask_group_assignment") suspend fun getAll(): List<MicrotaskGroupAssignmentRecord>

  @Query("SELECT * FROM microtask_group_assignment WHERE id == :id")
  suspend fun getById(id: String): MicrotaskGroupAssignmentRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: MicrotaskGroupAssignmentRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<MicrotaskGroupAssignmentRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
