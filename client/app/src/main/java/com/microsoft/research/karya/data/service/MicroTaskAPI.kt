package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path

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
