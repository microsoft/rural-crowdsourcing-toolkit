package com.microsoft.research.karya.data.remote.response


import com.google.gson.annotations.SerializedName

data class Meta(
    @SerializedName("account")
    val account: Account,
    @SerializedName("name")
    val name: String
)
