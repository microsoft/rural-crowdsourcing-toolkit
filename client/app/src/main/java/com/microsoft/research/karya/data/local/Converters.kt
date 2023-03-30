// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.google.gson.reflect.TypeToken
import com.microsoft.research.karya.data.model.karya.AssignmentGranularityType
import com.microsoft.research.karya.data.model.karya.AssignmentOrderType
import com.microsoft.research.karya.data.model.karya.ChecksumAlgorithm
import com.microsoft.research.karya.data.model.karya.enums.*

class Converters {

  @TypeConverter
  fun fromStringToJsonElement(value: String?): JsonElement {
    if (value == null) return JsonNull.INSTANCE

    return Gson().fromJson(value, JsonElement::class.java)
  }

  @TypeConverter
  fun fromJsonElementToString(list: JsonElement?): String? {
    if (list == null) return null

    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToAssignmentGranularityType(value: String?): AssignmentGranularityType? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<AssignmentGranularityType>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromAssignmentGranularityTypetoString(list: AssignmentGranularityType?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToAssignmentOrderTypeType(value: String?): AssignmentOrderType? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<AssignmentOrderType>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromAssignmentOrderTypeTypetoString(list: AssignmentOrderType?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToAuthProviderType(value: String?): AuthType? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<AuthType>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromAuthProviderTypetoString(list: AuthType?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToFileCreatorType(value: String?): FileCreator? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<FileCreator>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromFileCreatortoString(list: FileCreator?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToChecksumAlgorithmType(value: String?): ChecksumAlgorithm? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<ChecksumAlgorithm>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromChecksumAlgorithmtoString(list: ChecksumAlgorithm?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToTaskStatus(value: String?): TaskStatus? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<TaskStatus>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromTaskStatustoString(list: TaskStatus?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToMicrotaskAssignmentStatus(value: String?): MicrotaskAssignmentStatus? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<MicrotaskAssignmentStatus>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromMicrotaskAssignmentStatustoString(list: MicrotaskAssignmentStatus?): String? {
    if (list == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(list)
  }

  @TypeConverter
  fun fromStringToScenarioType(value: String?): ScenarioType? {
    if (value == null) {
      return null
    }
    val listType = object : TypeToken<ScenarioType>() {}.type
    return Gson().fromJson(value, listType)
  }

  @TypeConverter
  fun fromScenarioTypeToString(scenarioType: ScenarioType?): String? {
    if (scenarioType == null) {
      return null
    }
    val gson = Gson()
    return gson.toJson(scenarioType)
  }

  @TypeConverter
  fun fromStringToAccountRecordStatus(value: String?): AccountRecordStatus? {
    if (value == null) {
      return null
    }
    return AccountRecordStatus.valueOf(value)
  }

  @TypeConverter
  fun fromAccountRecordStatusToString(accountRecordStatus: AccountRecordStatus?): String? {
    if (accountRecordStatus == null) {
      return null
    }
    return accountRecordStatus.status
  }
}
