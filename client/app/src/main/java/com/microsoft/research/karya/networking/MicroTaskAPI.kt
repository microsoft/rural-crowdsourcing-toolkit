package com.microsoft.research.karya.networking

import com.microsoft.research.karya.database.models.KaryaFileRecord
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface MicroTaskAPI {

    @Multipart
    @POST("/microtask_assignment/{id}/output_file")
    suspend fun postUploads(
        @Header("auth-provider") authProvider: String,
        @Header("id-token") idTokenHeader: String,
        @Path("id") microtaskAssignmentID: String,
        @Part json: MultipartBody.Part,
        @Part file: MultipartBody.Part
    ): Response<KaryaFileRecord>

    @GET("/microtask_assignment/{id}/input_file")
    suspend fun getInputFileForAssignment(
        @Header("auth-provider") authProvider: String,
        @Header("id-token") idToken: String,
        @Path("id") microtaskAssignmentID: String
    ): Response<ResponseBody>
}
