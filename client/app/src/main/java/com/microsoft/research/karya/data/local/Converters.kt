// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local

import android.util.Log
import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.reflect.TypeToken
import com.microsoft.research.karya.data.model.karya.*
import java.math.BigInteger
import java.text.SimpleDateFormat
import java.util.*

class Converters {

    @TypeConverter
    fun fromStringtoBigint(value: String?): BigInteger? {
        if (value == null) {
            return null
        }
        return BigInteger(value)
    }

    @TypeConverter
    fun fromBiginttoString(list: BigInteger?): String? {
        Log.d("bigint", list.toString())
        if (list == null) {
            return null
        }
        return list.toString()
    }

    @TypeConverter
    fun fromDatetoString(list: Date?): String? {
        if (list == null) {
            return null
        }
        val dateFormat =
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        return dateFormat.format(list)
    }

    @TypeConverter
    fun fromStringToJsonObject(value: String?): JsonObject? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<JsonObject>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromJsonObjecttoString(list: JsonObject?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }

    @TypeConverter
    fun fromStringToAssignmentGranularityType(value: String?): AssignmentGranularityType? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<AssignmentGranularityType>() {
        }.type
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
        val listType = object : TypeToken<AssignmentOrderType>() {
        }.type
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
    fun fromStringToLanguageResourceType(value: String?): LanguageResourceType? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<LanguageResourceType>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromLanguageResourceTypetoString(list: LanguageResourceType?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }

    @TypeConverter
    fun fromStringToAuthProviderType(value: String?): AuthProviderType? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<AuthProviderType>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromAuthProviderTypetoString(list: AuthProviderType?): String? {
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
        val listType = object : TypeToken<FileCreator>() {
        }.type
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
        val listType = object : TypeToken<ChecksumAlgorithm>() {
        }.type
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
        val listType = object : TypeToken<TaskStatus>() {
        }.type
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
    fun fromStringToMicrotaskGroupStatus(value: String?): MicrotaskGroupStatus? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<MicrotaskGroupStatus>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromMicrotaskGroupStatustoString(list: MicrotaskGroupStatus?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }

    @TypeConverter
    fun fromStringToMicrotaskStatus(value: String?): MicrotaskStatus? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<MicrotaskStatus>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromMicrotaskStatustoString(list: MicrotaskStatus?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }

    @TypeConverter
    fun fromStringToTaskAssignmentStatus(value: String?): TaskAssignmentStatus? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<TaskAssignmentStatus>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromTaskAssignmentStatustoString(list: TaskAssignmentStatus?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }

    @TypeConverter
    fun fromStringToMicrotaskGroupAssignmentStatus(value: String?): MicrotaskGroupAssignmentStatus? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<MicrotaskGroupAssignmentStatus>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromMicrotaskGroupAssignmentStatustoString(list: MicrotaskGroupAssignmentStatus?): String? {
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
        val listType = object : TypeToken<MicrotaskAssignmentStatus>() {
        }.type
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
    fun fromStringToPayoutInfoStatus(value: String?): PayoutInfoStatus? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<PayoutInfoStatus>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromPayoutInfoStatustoString(list: PayoutInfoStatus?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }
    @TypeConverter
    fun fromStringToPaymentRequestStatus(value: String?): PaymentRequestStatus? {
        if (value == null) {
            return null
        }
        val listType = object : TypeToken<PaymentRequestStatus>() {
        }.type
        return Gson().fromJson(value, listType)
    }

    @TypeConverter
    fun fromPaymentRequestStatustoString(list: PaymentRequestStatus?): String? {
        if (list == null) {
            return null
        }
        val gson = Gson()
        return gson.toJson(list)
    }
}
