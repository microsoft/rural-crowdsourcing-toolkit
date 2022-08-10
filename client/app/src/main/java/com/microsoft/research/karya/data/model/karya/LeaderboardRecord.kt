package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "leaderboard")
data class LeaderboardRecord(
  @PrimaryKey val workerId: String,
  val name: String,
  val XP: String,
  val rank: String,
)
