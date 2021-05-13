package com.microsoft.research.karya.data.local.ng

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.google.gson.JsonElement
import com.microsoft.research.karya.data.local.daos.BasicDao
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord

@Dao
interface WorkerDao : BasicDao<WorkerRecord> {

  @Query("SELECT * FROM worker") suspend fun getAll(): List<WorkerRecord>

  @Query("SELECT * FROM worker WHERE id == :id") suspend fun getById(id: String): WorkerRecord?

  @Query("SELECT * FROM worker where accessCode == :accessCode")
  suspend fun getByAccessCode(accessCode: String): WorkerRecord?

  @Query("UPDATE worker SET params=:params WHERE id == :id")
  suspend fun updateParamsForId(params: JsonElement, id: String)

  /*
    TODO: Check with Anurag if we still require these
    @Query("UPDATE worker SET last_received_from_box_at=:lastUpdatedAt WHERE id=:id")
    suspend fun updateLastReceivedFromBox(id: String, lastUpdatedAt: String)

    @Query("UPDATE worker SET last_sent_to_box_at=:sendDateTime") suspend fun updateLastSentToBoxAt(sendDateTime: String)

    @Query("UPDATE worker SET id_token=:idToken WHERE id == :workerId") suspend fun updateIdTokenForId(idToken: String, workerId: String)
  */

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: WorkerRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<WorkerRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
