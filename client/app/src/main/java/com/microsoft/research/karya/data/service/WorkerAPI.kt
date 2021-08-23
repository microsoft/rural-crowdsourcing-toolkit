package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface WorkerAPI {

  @PUT("/worker/otp/generate")
  suspend fun generateOTP(
    @Header("access-code") accessCode: String,
    @Header("phone-number") phoneNumber: String,
  ): Response<ResponseBody>

  @PUT("/worker/otp/resend")
  suspend fun resendOTP(
    @Header("access-code") accessCode: String,
    @Header("phone-number") phoneNumber: String,
  ): Response<ResponseBody>

  @PUT("/worker/otp/verify")
  suspend fun verifyOTP(
    @Header("access-code") accessCode: String,
    @Header("phone-number") phoneNumber: String,
    @Header("otp") otp: String,
  ): Response<WorkerRecord>

  /*
   * This API would be used before OTP to determine App language and check the validity of access code
   * */
  @GET("/worker")
  suspend fun getWorkerUsingAccessCode(
    @Header("access-code") accessCode: String,
  ): Response<WorkerRecord>

  /*
   * This API would be used whenever needed after the successful OTP verification
   * */
  @GET("/worker")
  suspend fun getWorkerUsingIdToken(
    @Header("karya-id-token") idToken: String,
  ): Response<WorkerRecord>

  @PUT("/worker")
  suspend fun updateWorker(
    @Header("karya-id-token") idToken: String,
    @Body registerOrUpdateWorkerRequest: RegisterOrUpdateWorkerRequest,
    @Query("action") action: String,
  ): Response<WorkerRecord>

  @PUT("/worker")
  suspend fun updateWorker(
    @Header("karya-id-token") idToken: String,
    @Body worker: WorkerRecord,
  ): Response<WorkerRecord>
}
