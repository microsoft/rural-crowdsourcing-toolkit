package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.remote.response.ValidAccessCodeResponse
import retrofit2.Response
import retrofit2.http.*

interface WorkerAPI {

  @PUT("/worker/otp")
  suspend fun getOrVerifyOTP(
      @Header("access-code") accessCode: String,
      @Header("phone-number") phoneNumber: String,
      @Header("otp") otp: String,
      @Query("action") action: String, // TODO: Make this an enum class
  ): Response<WorkerRecord>

  /*
   * This API would be used before OTP to determine App language and check the validity of access code
   * */
  @GET("/getWorker")
  suspend fun getWorkerUsingAccessCode(
      @Header("access-code") accessCode: String
  ): Response<ValidAccessCodeResponse>

  /*
   * This API would be used whenever needed after the successful OTP verification
   * */
  @GET("/getWorker")
  suspend fun getWorkerUsingIdToken(@Header("id-token") idToken: String): Response<WorkerRecord>

  @PUT("/worker")
  suspend fun updateWorker(
      @Header("id-token") idToken: String,
      @Body worker: WorkerRecord
  ): Response<WorkerRecord>
}
