// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.database.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.database.models.LanguageRecord

@Dao
interface LanguageDaoExtra {
  @Query("SELECT * FROM language WHERE string_support=:support")
  suspend fun getStringSupported(support: Boolean = true): List<LanguageRecord>

  @Query("SELECT * FROM language WHERE list_support=:support")
  suspend fun getListSupported(support: Boolean = true): List<LanguageRecord>
}
