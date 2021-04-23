// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.data.model.karya.LanguageResourceValueRecord

@Dao
interface LanguageResourceValueDaoExtra {
  @Query(
    "SELECT * FROM language_resource_value WHERE language_resource_id = (SELECT id FROM language_resource WHERE name=:name)"
  )
  suspend fun getValuesFromName(name: String): List<LanguageResourceValueRecord>

  @Query(
    "SELECT value FROM language_resource_value WHERE language_id=:languageID and language_resource_id =(SELECT id FROM language_resource WHERE name=:name )"
  )
  suspend fun getValueFromName(languageID: Int, name: String): String

  @Query(
    "SELECT value FROM language_resource_value WHERE language_id=:languageID and language_resource_id =(SELECT id FROM language_resource WHERE name=:name and scenario_id=:scenarioID )"
  )
  suspend fun getValueFromNameAndScenario(languageID: Int, scenarioID: Int, name: String): String?
}
