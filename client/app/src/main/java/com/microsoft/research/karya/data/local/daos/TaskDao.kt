// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema
 * repository. DO NOT EDIT DIRECTLY.
 */

package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.data.model.karya.TaskRecord

@Dao
interface TaskDao : BasicDao<TaskRecord> {

    @Query("SELECT * FROM task")
    suspend fun getAll(): List<TaskRecord>

    @Query("SELECT * FROM task WHERE id == :id")
    suspend fun getById(id: String): TaskRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: TaskRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<TaskRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
