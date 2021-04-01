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
import com.microsoft.research.karya.data.model.karya.PolicyRecord

@Dao
interface PolicyDao : BasicDao<PolicyRecord> {

    @Query("SELECT * FROM policy")
    suspend fun getAll(): List<PolicyRecord>

    @Query("SELECT * FROM policy WHERE id == :id")
    suspend fun getById(id: Int): PolicyRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: PolicyRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<PolicyRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
