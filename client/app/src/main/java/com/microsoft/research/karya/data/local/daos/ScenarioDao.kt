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
import com.microsoft.research.karya.data.model.karya.ScenarioRecord

@Dao
interface ScenarioDao : BasicDao<ScenarioRecord> {

    @Query("SELECT * FROM scenario")
    suspend fun getAll(): List<ScenarioRecord>

    @Query("SELECT * FROM scenario WHERE id == :id")
    suspend fun getById(id: Int): ScenarioRecord

    /**
     * Upsert a [record] in the table
     */
    @Transaction
    suspend fun upsert(record: ScenarioRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }

    /**
     * Upsert a list of [records] in the table
     */
    @Transaction
    suspend fun upsert(records: List<ScenarioRecord>) {
        insertForUpsert(records)
        updateForUpsert(records)
    }
}
