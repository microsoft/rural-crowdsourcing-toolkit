package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.LanguageRecord
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface LanguageAPI {

    @GET("/languages")
    suspend fun getLanguages(
        @Header("access-code") accessCode: String,
    ): Response<List<LanguageRecord>>
}
