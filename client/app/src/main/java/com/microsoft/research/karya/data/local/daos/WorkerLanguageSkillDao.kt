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
import com.microsoft.research.karya.data.model.karya.WorkerLanguageSkillRecord

@Dao
interface WorkerLanguageSkillDao : BasicDao<WorkerLanguageSkillRecord> {

    @Query("SELECT * FROM worker_language_skill")
    suspend fun getAll(): List<WorkerLanguageSkillRecord>

    @Query("SELECT * FROM worker_language_skill WHERE id == :id")
    suspend fun getById(id: String): WorkerLanguageSkillRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: WorkerLanguageSkillRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<WorkerLanguageSkillRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
