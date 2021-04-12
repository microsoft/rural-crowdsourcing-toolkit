package com.microsoft.research.karya.data.service

import com.google.gson.JsonObject
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface KaryaFileAPI {

    @Multipart
    @POST("/karya_files")
    suspend fun uploadKaryaFile(
        @Header("x-id-token") idToken: String,
        @Part json: MultipartBody.Part,
        @Part file: MultipartBody.Part
    ): Response<JsonObject>

    @GET("/karya_file/{id}")
    suspend fun getKaryaFile(
        @Header("x-id-token") idToken: String,
        @Path("id") karyaFileId: String
    ): Response<ResponseBody>

}
