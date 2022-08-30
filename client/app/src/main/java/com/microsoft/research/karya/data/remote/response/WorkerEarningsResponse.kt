package com.microsoft.research.karya.data.remote.response

import com.google.gson.annotations.SerializedName

data class WorkerEarningsResponse(
  @SerializedName("total_paid") val totalPaid: Float,
  @SerializedName("week_earned") val weekEarned: Float,
  @SerializedName("total_earned") val totalEarned: Float
)
