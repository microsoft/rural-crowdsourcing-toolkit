package com.microsoft.research.karya.data.service

import androidx.work.Worker
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.WorkerLanguageSkillRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerObject
import com.microsoft.research.karya.data.remote.response.CreationCodeResponse
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface WorkerAPI {

    @PUT("/worker/{id}/otp")
    suspend fun getOrVerifyOTP(
        @Header("x-access-code") accessCode: String,
        @Header("x-phone-number") phoneNumber: String,
        @Header("x-otp") otp: String,
        @Query("action") action: String, //TODO: Make this an enum class
        @Path("id") workerRecordId: String
    ): Response<WorkerRecord>

    /*
    * This API would be used before OTP to determine App language and check the validity of access code
    * */
    @GET("/getWorker")
    suspend fun getWorkerUsingAccessCode(
        @Header("x-access-code") accessCode: String
    ): Response<JsonObject>

    /*
    * This API would be used whenever needed after the successful OTP verification
    * */
    @GET("/getWorker")
    suspend fun getWorkerUsingIdToken(
        @Header("x-id-token") idToken: String
    ): Response<WorkerRecord>

    @PUT("/worker/{id}")
    suspend fun updateWorker(
        @Header("x-id-token") idToken: String,
        @Path("id") workerRecordId: String,
        @Body worker: WorkerRecord
    ): Response<WorkerRecord>

}
