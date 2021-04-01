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
import com.microsoft.research.karya.data.model.karya.MicrotaskRecord

@Dao
interface MicrotaskDao : BasicDao<MicrotaskRecord> {

    @Query("SELECT * FROM microtask")
    suspend fun getAll(): List<MicrotaskRecord>

    @Query("SELECT * FROM microtask WHERE id == :id")
    suspend fun getById(id: String): MicrotaskRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: MicrotaskRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<MicrotaskRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
