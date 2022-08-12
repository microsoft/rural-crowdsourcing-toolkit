package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.data.model.karya.LeaderboardRecord

@Dao
interface LeaderboardDao : BasicDao<LeaderboardRecord> {
  @Query("SELECT * FROM leaderboard")
  suspend fun getAllLeaderboardRecords(): List<LeaderboardRecord>

  @Query("SELECT XP FROM leaderboard WHERE workerId=:worker_id")
  suspend fun getXPPoints(worker_id: String): Int?
}
