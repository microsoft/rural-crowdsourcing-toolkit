package com.microsoft.research.karya.data.model.karya.ng

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.JsonObject

@Entity(tableName = "worker")
data class WorkerRecord(
  @PrimaryKey val id: String,
  val age: String,
  val accessCode: String,
  val appLanguage: Int,
  val authType: AuthType,
  val email: String,
  val fullName: String,
  val gender: String,
  val idToken: String,
  val oauthId: String,
  val params: JsonObject,
  val passwordHash: String,
  val phoneNumber: String,
  val profilePicturePath: String,
  val salt: String,
  val username: String,
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
