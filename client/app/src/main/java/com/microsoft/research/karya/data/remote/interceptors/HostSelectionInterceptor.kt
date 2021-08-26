package com.microsoft.research.karya.data.remote.interceptors

import com.microsoft.research.karya.data.manager.BaseUrlManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class HostSelectionInterceptor(val baseUrlManager: BaseUrlManager): Interceptor {
  // The URL to which the request will be sent
  private lateinit var BASE_URL: String

  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val newRequestBuilder = request.newBuilder()
    val newRequest = runBlocking {
      val baseUrl = baseUrlManager.getBaseUrl()
      newRequestBuilder.url(baseUrl).build()
    }

    return chain.proceed(newRequest)
  }
}