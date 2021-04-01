// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.google.gson.JsonObject

@Dao
interface WorkerDaoExtra {
    @Query("UPDATE worker SET app_language=:language_id")
    suspend fun updateAppLanguage(language_id: Int)

    @Query("UPDATE worker SET last_received_from_box_at=:lastUpdatedAt WHERE id=:id")
    suspend fun updateLastReceivedFromBox(id: String, lastUpdatedAt: String)

    @Query("UPDATE worker SET last_sent_to_box_at=:sendDateTime")
    suspend fun updateLastSentToBoxAt(sendDateTime: String)

    @Query("UPDATE worker SET id_token=:id_token")
    suspend fun updateIdToken(id_token: String)

    @Query("UPDATE worker SET params=:params")
    suspend fun updateParams(params: JsonObject)
}
