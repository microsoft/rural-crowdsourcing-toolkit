package com.microsoft.research.karya.data.service

import com.google.gson.JsonArray
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.remote.response.GetAssignmentsResponse
import okhttp3.MultipartBody
import okhttp3.ResponseBody
import org.json.JSONArray
import retrofit2.Response
import retrofit2.http.*

interface MicroTaskAPI {

    @PUT("/assignments")
    suspend fun submitAssignments(
        @Header("id-token") idTokenHeader: String,
        @Body updates: JsonArray
    ): Response<List<String>>

    @GET("/assignments")
    suspend fun getAssignments(
        @Header("id-token") idTokenHeader: String,
        @Query("type") type: String, //TODO: Make this an enum class
        @Query("from") from: String,
    ): Response<GetAssignmentsResponse>
}
