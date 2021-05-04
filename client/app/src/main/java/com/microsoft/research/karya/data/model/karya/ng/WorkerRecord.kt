package com.microsoft.research.karya.data.model.karya.ng

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName

@Entity(tableName = "worker")
data class WorkerRecord(
  @PrimaryKey @SerializedName("id") val id: String,
  @SerializedName("access_code") val accessCode: String,
  @SerializedName("app_language") val appLanguage: Int,
  @SerializedName("age") val age: String?,
  @SerializedName("auth_type") val authType: AuthType?,
  @SerializedName("email") val email: String?,
  @SerializedName("full_name") val fullName: String?,
  @SerializedName("gender") val gender: String?,
  @SerializedName("id_token") val idToken: String?,
  @SerializedName("oauth_id") val oauthId: String?,
  @SerializedName("params") val params: JsonObject?,
  @SerializedName("passwd_hash") val passwordHash: String?,
  @SerializedName("phone_number") val phoneNumber: String?,
  @SerializedName("profile_picture") val profilePicturePath: String?,
  @SerializedName("salt") val salt: String?,
  @SerializedName("username") val username: String?,
) {
  companion object {
    fun createEmptyWorker(): WorkerRecord {
      return WorkerRecord(
        id = "",
        age = "",
        accessCode = "",
        appLanguage = -1,
        authType = AuthType.PHONE_OTP,
        email = "",
        fullName = "",
        gender = "",
        idToken = "",
        oauthId = "",
        params = JsonObject(),
        passwordHash = "",
        phoneNumber = "",
        profilePicturePath = "",
        salt = "",
        username = "",
      )
    }
  }
}
