package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.remote.response.GetAssignmentsResponse
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface MicroTaskAssignmentAPI {

  @PUT("/assignments")
  suspend fun submitCompletedAssignments(
    @Header("karya-id-token") idTokenHeader: String,
    @Body updates: List<MicroTaskAssignmentRecord>,
  ): Response<List<String>>

  @PUT("/skipped_assignments")
  suspend fun submitSkippedAssignments(
    @Header("karya-id-token") idToken: String,
    @Body ids: List<MicroTaskAssignmentRecord>
  ): Response<List<String>>

  @GET("/assignments")
  suspend fun getNewAssignments(
    @Header("karya-id-token") idTokenHeader: String,
    @Query("from") from: String,
    @Query("type") type: String = "new",
  ): Response<GetAssignmentsResponse>

  @GET("/assignments")
  suspend fun getVerifiedAssignments(
    @Header("karya-id-token") idTokenHeader: String,
    @Query("from") from: String,
    @Query("type") type: String = "verified",
  ): Response<List<MicroTaskAssignmentRecord>>

  @Multipart
  @POST("/assignment/{id}/output_file")
  suspend fun submitAssignmentOutputFile(
    @Header("karya-id-token") idTokenHeader: String,
    @Path("id") id: String,
    @Part json: MultipartBody.Part,
    @Part file: MultipartBody.Part,
  ): Response<KaryaFileRecord>

  @GET("/assignment/{id}/input_file")
  suspend fun getInputFile(
    @Header("karya-id-token") idToken: String,
    @Path("id") assignmentId: String,
  ): Response<ResponseBody>
}
