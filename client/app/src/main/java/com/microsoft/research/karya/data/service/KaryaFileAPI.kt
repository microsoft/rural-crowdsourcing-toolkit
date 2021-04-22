package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface KaryaFileAPI {

    @Multipart
    @POST("/karya_file")
    suspend fun uploadKaryaFile(
        @Header("id-token") idToken: String,
        @Part json: MultipartBody.Part,
        @Part file: MultipartBody.Part,
    ): Response<KaryaFileRecord>

    @GET("/karya_file/{id}")
    suspend fun getKaryaFile(
        @Header("access-code") accessCode: String,
        @Header("id-token") idToken: String,
        @Path("id") karyaFileId: String,
    ): Response<ResponseBody>

}
