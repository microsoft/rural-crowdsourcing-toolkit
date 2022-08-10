package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.data.model.karya.LeaderboardRecord

@Dao
interface LeaderboardDao : BasicDao<LeaderboardRecord> {
  @Query("SELECT * FROM leaderboard") suspend fun getAllLeaderboardRecords(): List<LeaderboardRecord>

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<LeaderboardRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }
}
