package com.microsoft.research.karya.data.service

import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.WorkerLanguageSkillRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerObject
import com.microsoft.research.karya.data.remote.response.CreationCodeResponse
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.Response
import retrofit2.http.*

interface WorkersAPI {
    @GET("/worker/cc/{creation_code}")
    suspend fun checkCreationCode(@Path("creation_code") id: String): Response<CreationCodeResponse>

    @PUT("/worker/phone-auth")
    suspend fun sendOTP(@Body worker: JsonObject): Response<WorkerRecord>

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
    ): Response<WorkerLanguageSkillRecord>

    @PUT("/worker_language_skill/{id}")
    fun updateSkill(
        @Body skillObject: WorkerLanguageSkillObject,
        @Header("auth-provider") authProvider: String,
        @Header("id-token") idTokenHeader: String,
        @Path("id") workerLanguageSkillId: String
    ): Response<WorkerLanguageSkillRecord>

    @POST("/db/updates-for-worker")
    fun getUpdates(
        @Header("auth-provider") authProvider: String,
        @Header("id-token") idTokenHeader: String,
        @Body worker: WorkerRecord
    ): Response<JsonArray>

    @GET("/microtask_assignment/{id}/input_file")
    suspend fun getInputFileForAssignment(
        @Header("auth-provider") authProvider: String,
        @Header("id-token") idToken: String,
        @Path("id") microtaskAssignmentID: String
    ): Response<ResponseBody>

}