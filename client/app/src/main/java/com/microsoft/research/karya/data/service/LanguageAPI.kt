package com.microsoft.research.karya.data.service

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Path

interface LanguageAPI {

  @GET("/language_assets/{code}")
  suspend fun getLanguageAssets(
    @Header("access-code") accessCode: String,
    @Path("code") code: String,
  ): Response<ResponseBody>
}
