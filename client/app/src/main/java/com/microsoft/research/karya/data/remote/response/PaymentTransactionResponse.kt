package com.microsoft.research.karya.data.remote.response


import com.google.gson.annotations.SerializedName

data class PaymentTransactionResponse(
    @SerializedName("account_id")
    val accountId: String,
    @SerializedName("amount")
    val amount: Int,
    @SerializedName("box_id")
    val boxId: String,
    @SerializedName("meta")
    val meta: Meta,
    @SerializedName("mode")
    val mode: String,
    @SerializedName("purpose")
    val purpose: String,
    @SerializedName("source_account")
    val sourceAccount: String,
    @SerializedName("status")
    val status: String,
    @SerializedName("utr")
    val utr: String,
    @SerializedName("worker_id")
    val workerId: String,
    @SerializedName("created_at")
    val createdAt: String
)
