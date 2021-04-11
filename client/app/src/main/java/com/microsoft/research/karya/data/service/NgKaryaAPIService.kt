// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.service

import androidx.work.Worker
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.model.karya.LanguageRecord
import com.microsoft.research.karya.data.model.karya.LanguageResourceRecord
import com.microsoft.research.karya.data.model.karya.LanguageResourceValueRecord
import com.microsoft.research.karya.data.model.karya.ScenarioRecord
import com.microsoft.research.karya.data.model.karya.WorkerLanguageSkillRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerObject
import com.microsoft.research.karya.data.remote.response.CreationCodeResponse
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import org.json.JSONArray
import retrofit2.Call
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query

interface NgKaryaAPIService {
    @GET("/getWorker")
    suspend fun getWorker(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String
    ): Response<Worker>

    @PUT("/worker/{id}/otp")
    suspend fun getOrVerifyOTP(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String,
        @Header("x-phone-number") phoneNumber: String,
        @Header("x-otp") otp: String,
        @Query("action") action: String, //TODO: Make this an enum class
        @Path("id") workerRecordId: String
    ): Response<JsonObject>

    @PUT("/worker/{id}")
    suspend fun updateWorker(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String,
        @Path("id") workerRecordId: String
    ): Response<Worker>

    @GET("/languages")
    suspend fun getLanguages(): Response<List<LanguageRecord>>

    @Multipart
    @POST("/karya_files")
    suspend fun uploadKaryaFile(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String,
        @Part json: MultipartBody.Part,
        @Part file: MultipartBody.Part
    ): Response<JsonObject>

    @GET("/karya_file/{id}")
    suspend fun getKaryaFile(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String,
        @Path("id") karyaFileId: String
    ): Response<ResponseBody>

    @PUT("/assignments")
    suspend fun submitAssignments(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String,
        @Body updates: JsonArray
    ): Response<JsonArray>

    @GET("/assignments")
    suspend fun getAssignments(
        @Header("x-id-token") idTokenHeader: String,
        @Header("x-access-code") accessCodeHeader: String,
        @Query("type") type: String, //TODO: Make this an enum class
        @Query("from") from: String,
    ): Response<JSONArray> // TODO: Modify this output type according to response type
}
