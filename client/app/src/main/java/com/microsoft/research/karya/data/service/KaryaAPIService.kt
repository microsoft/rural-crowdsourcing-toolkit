// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.service

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

interface KaryaAPIService {
  @GET("/language") suspend fun getLanguages(): Response<List<LanguageRecord>>

  @GET("/scenario") suspend fun getScenarios(): Response<List<ScenarioRecord>>

  @GET("/language_resource")
  suspend fun getLanguageResources(): Response<List<LanguageResourceRecord>>

  @GET("/language_resource_value")
  suspend fun getLanguageResourceValues(): Response<List<LanguageResourceValueRecord>>

  @GET("/file_language_resource_value")
  suspend fun getFileLanguageResourceValuesByLanguageResourceId(
      @Query("language_resource_id") languageResourceId: Int
  ): Response<ResponseBody>

  @GET("/file_language_resource_value")
  suspend fun getFileLanguageResourceValuesByLanguageId(
      @Query("language_id") languageId: Int
  ): Response<ResponseBody>

  @GET("/worker/cc/{creation_code}")
  suspend fun checkCreationCode(@Path("creation_code") id: String): Response<CreationCodeResponse>

  @PUT("/worker/phone-auth") suspend fun sendOTP(@Body worker: JsonObject): Response<WorkerRecord>

  @PUT("/worker/phone-auth?resend=true")
  suspend fun resendOTP(@Body worker: JsonObject): Response<WorkerRecord>

  @PUT("/worker/update/cc")
  suspend fun updateWorkerUsingCreationCode(@Body worker: WorkerObject): Response<WorkerRecord>

  @PUT("/worker/refresh_token")
  suspend fun refreshIdToken(
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idTokenHeader: String
  ): Response<WorkerRecord>

  @POST("/worker_language_skill")
  fun registerSkill(
      @Body skillObject: WorkerLanguageSkillObject,
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idTokenHeader: String
  ): Call<WorkerLanguageSkillRecord>

  @PUT("/worker_language_skill/{id}")
  fun updateSkill(
      @Body skillObject: WorkerLanguageSkillObject,
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idTokenHeader: String,
      @Path("id") workerLanguageSkillId: String
  ): Call<WorkerLanguageSkillRecord>

  @POST("/db/updates-for-worker")
  fun getUpdates(
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idTokenHeader: String,
      @Body worker: WorkerRecord
  ): Call<JsonArray>

  @Multipart
  @POST("/microtask_assignment/{id}/output_file")
  fun postUploads(
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idTokenHeader: String,
      @Path("id") microtaskAssignmentID: String,
      @Part json: MultipartBody.Part,
      @Part file: MultipartBody.Part
  ): Call<KaryaFileRecord>

  @POST("/db/updates-from-worker")
  fun postUpdates(
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idTokenHeader: String,
      @Body updates: JsonArray
  ): Call<ResponseBody>

  @GET("/microtask_assignment/{id}/input_file")
  suspend fun getInputFileForAssignment(
      @Header("auth-provider") authProvider: String,
      @Header("id-token") idToken: String,
      @Path("id") microtaskAssignmentID: String
  ): Response<ResponseBody>
}
