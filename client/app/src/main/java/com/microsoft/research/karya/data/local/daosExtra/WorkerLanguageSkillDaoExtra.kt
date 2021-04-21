// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.data.model.karya.WorkerLanguageSkillRecord

@Dao
interface WorkerLanguageSkillDaoExtra {
  @Query(
      "UPDATE worker_language_skill SET can_read=:canRead, can_speak=:canSpeak, can_type=:canType, last_updated_at=:updatedAt WHERE language_id=:languageID")
  suspend fun updateSkills(
      languageID: Int,
      canRead: Boolean,
      canSpeak: Boolean,
      canType: Boolean,
      updatedAt: String
  )

  @Query("SELECT * FROM worker_language_skill WHERE language_id=:languageId")
  suspend fun getSkillsForLanguage(languageId: Int): WorkerLanguageSkillRecord?

  @Query("SELECT * FROM worker_language_skill WHERE last_updated_at > :from")
  suspend fun getUpdatesSince(from: String): List<WorkerLanguageSkillRecord>
}
