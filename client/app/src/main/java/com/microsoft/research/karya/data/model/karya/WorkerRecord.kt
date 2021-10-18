package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName
import com.microsoft.research.karya.data.model.karya.enums.AuthType

@Entity(tableName = "worker")
data class WorkerRecord(
  @PrimaryKey @SerializedName("id") val id: String,
  @SerializedName("access_code") val accessCode: String,
  @SerializedName("language") val language: String,
  @SerializedName("year_of_birth") val yob: String?,
  @SerializedName("reg_mechanism") val authType: AuthType?,
  @SerializedName("email") val email: String?,
  @SerializedName("full_name") val fullName: String?,
  @SerializedName("gender") val gender: String?,
  @SerializedName("id_token") val idToken: String?,
  @SerializedName("auth_id") val authId: String?,
  @SerializedName("params") val params: JsonElement?,
  @SerializedName("phone_number") val phoneNumber: String?,
  @SerializedName("profile_picture") val profilePicturePath: String?,
  @SerializedName("username") val username: String?,
  @SerializedName("isConsentProvided") val isConsentProvided: Boolean = false,
) {
  companion object {
    fun createEmptyWorker(): WorkerRecord {
      return WorkerRecord(
        id = "",
        yob = "",
        accessCode = "",
        language = "en",
        authType = AuthType.PHONE_OTP,
        email = "",
        fullName = "",
        gender = "",
        idToken = "",
        authId = "",
        params = JsonObject(),
        phoneNumber = "",
        profilePicturePath = "",
        username = "",
      )
    }
  }
}
