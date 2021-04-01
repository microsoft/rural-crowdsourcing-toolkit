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
import com.microsoft.research.karya.data.model.karya.WorkerRecord

@Dao
interface WorkerDao : BasicDao<WorkerRecord> {

    @Query("SELECT * FROM worker")
    suspend fun getAll(): List<WorkerRecord>

    @Query("SELECT * FROM worker WHERE id == :id")
    suspend fun getById(id: String): WorkerRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: WorkerRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<WorkerRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
