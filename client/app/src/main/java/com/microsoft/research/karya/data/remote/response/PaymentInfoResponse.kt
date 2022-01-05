package com.microsoft.research.karya.data.remote.response

import com.google.gson.annotations.SerializedName

data class PaymentInfoResponse(
  @SerializedName("account_type") val accountType: String,
  @SerializedName("active") val active: Boolean,
  @SerializedName("fund_id") val fundId: String,
  @SerializedName("id") val id: String?,
  @SerializedName("meta") val meta: Meta,
  @SerializedName("status") val status: String
)
