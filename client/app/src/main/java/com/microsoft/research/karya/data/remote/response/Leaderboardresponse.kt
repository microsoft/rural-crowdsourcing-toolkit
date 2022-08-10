package com.microsoft.research.karya.data.remote.response

import com.google.gson.annotations.SerializedName

data class LeaderboardResponse(
  @SerializedName("leaderboard") val leaderboard: List<LeaderboardResponse>,
  @SerializedName("worker_leaderboard_record") val workerLeaderboardRecord: LeaderboardResponse
)
