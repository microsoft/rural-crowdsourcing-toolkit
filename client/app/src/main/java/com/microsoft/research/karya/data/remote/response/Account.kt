package com.microsoft.research.karya.data.remote.response

import com.google.gson.annotations.SerializedName

data class Account(
  @SerializedName("id") val id: String,
  @SerializedName("ifsc") val ifsc: String?
)
