package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import com.microsoft.research.karya.data.remote.response.ValidAccessCodeResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PUT
import retrofit2.http.Query

interface WorkerAPI {

    @PUT("/worker/otp")
    suspend fun getOrVerifyOTP(
        @Header("access-code") accessCode: String,
        @Header("phone-number") phoneNumber: String,
        @Header("otp") otp: String,
        @Query("action") action: String, //TODO: Make this an enum class
    ): Response<WorkerRecord>

    /*
    * This API would be used before OTP to determine App language and check the validity of access code
    * */
    @GET("/worker")
    suspend fun getWorkerUsingAccessCode(
        @Header("access-code") accessCode: String,
    ): Response<ValidAccessCodeResponse>

    /*
    * This API would be used whenever needed after the successful OTP verification
    * */
    @GET("/worker")
    suspend fun getWorkerUsingIdToken(
        @Header("id-token") idToken: String,
    ): Response<WorkerRecord>

    @PUT("/worker")
    suspend fun updateWorker(
        @Header("id-token") idToken: String,
        @Header("access-code") accessCode: String,
        @Body registerOrUpdateWorkerRequest: RegisterOrUpdateWorkerRequest,
    ): Response<WorkerRecord>

}
