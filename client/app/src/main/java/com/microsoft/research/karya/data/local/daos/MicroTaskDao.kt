// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import kotlinx.coroutines.flow.Flow

@Dao
interface MicroTaskDao : BasicDao<MicroTaskRecord> {

  @Query("SELECT * FROM microtask") suspend fun getAll(): List<MicroTaskRecord>

  @Query("SELECT * FROM microtask") fun getAllAsFlow(): Flow<List<MicroTaskRecord>>

  @Query("SELECT * FROM microtask WHERE id == :id") suspend fun getById(id: String): MicroTaskRecord

  @Query("SELECT * FROM microtask WHERE task_id == :taskId")
  suspend fun getByTaskId(taskId: String): List<MicroTaskRecord>

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: MicroTaskRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<MicroTaskRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
