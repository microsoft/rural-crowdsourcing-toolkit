package com.microsoft.research.karya.data.remote.request

import com.google.gson.annotations.SerializedName

data class PaymentAccountRequest(
    @SerializedName("account")
    val account: Account,
    @SerializedName("name")
    val name: String,
    @SerializedName("type")
    val type: String
)
