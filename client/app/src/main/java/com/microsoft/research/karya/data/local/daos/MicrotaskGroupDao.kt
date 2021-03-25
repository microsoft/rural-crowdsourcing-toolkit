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
import com.microsoft.research.karya.data.model.karya.MicrotaskGroupRecord

@Dao
interface MicrotaskGroupDao : BasicDao<MicrotaskGroupRecord> {

    @Query("SELECT * FROM microtask_group")
    suspend fun getAll(): List<MicrotaskGroupRecord>

    @Query("SELECT * FROM microtask_group WHERE id == :id")
    suspend fun getById(id: String): MicrotaskGroupRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: MicrotaskGroupRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<MicrotaskGroupRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
