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
import com.microsoft.research.karya.data.model.karya.TaskAssignmentRecord

@Dao
interface TaskAssignmentDao : BasicDao<TaskAssignmentRecord> {

  @Query("SELECT * FROM task_assignment") suspend fun getAll(): List<TaskAssignmentRecord>

  @Query("SELECT * FROM task_assignment WHERE id == :id") suspend fun getById(id: String): TaskAssignmentRecord

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: TaskAssignmentRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<TaskAssignmentRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
