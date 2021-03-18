// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.database.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.database.models.LanguageResourceType

@Dao
interface LanguageResourceDaoExtra {
    @Query("SELECT id FROM language_resource WHERE name=:name")
    suspend fun getIdFromName(name: String): Int

    @Query("SELECT id FROM language_resource WHERE list_resource=:listResource AND type=:type")
    suspend fun getListFileResources(
        listResource: Boolean = true,
        type: LanguageResourceType = LanguageResourceType.file_resource
    ): List<Int>
}
