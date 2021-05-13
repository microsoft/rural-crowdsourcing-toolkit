package com.microsoft.research.karya.data.model.karya.ng

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonElement
import com.google.gson.annotations.SerializedName

@Entity(tableName = "worker")
data class WorkerRecord(
  @PrimaryKey @SerializedName("id") val id: String,
  @SerializedName("creation_code") val accessCode: String,
  @SerializedName("app_language") val appLanguage: Int,
  @SerializedName("age") val age: String?,
  @SerializedName("auth_type") val authType: AuthType?,
  @SerializedName("email") val email: String?,
  @SerializedName("full_name") val fullName: String?,
  @SerializedName("gender") val gender: String?,
  @SerializedName("id_token") val idToken: String?,
  @SerializedName("oauth_id") val oauthId: String?,
  @SerializedName("params") val params: JsonElement,
  @SerializedName("passwd_hash") val passwordHash: String?,
  @SerializedName("phone_number") val phoneNumber: String?,
  @SerializedName("profile_picture") val profilePicturePath: String?,
  @SerializedName("salt") val salt: String?,
  @SerializedName("username") val username: String?,
)
