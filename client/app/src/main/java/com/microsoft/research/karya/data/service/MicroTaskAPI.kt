package com.microsoft.research.karya.data.service

import com.google.gson.JsonArray
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
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
    ): Response<JsonArray>

    @GET("/assignments")
    suspend fun getAssignments(
        @Header("id-token") idTokenHeader: String,
        @Query("type") type: String, //TODO: Make this an enum class
        @Query("from") from: String,
    ): Response<JSONArray> // TODO: Modify this output type according to response type
}
