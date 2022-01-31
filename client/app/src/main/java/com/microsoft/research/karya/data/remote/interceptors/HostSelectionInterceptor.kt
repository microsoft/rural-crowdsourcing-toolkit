package com.microsoft.research.karya.data.remote.interceptors

import com.microsoft.research.karya.data.manager.BaseUrlManager
import kotlinx.coroutines.runBlocking
import okhttp3.HttpUrl
import okhttp3.Interceptor
import okhttp3.Response
import java.net.URL

class HostSelectionInterceptor(val baseUrlManager: BaseUrlManager): Interceptor {

  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val newRequestBuilder = request.newBuilder()
    val newRequest = runBlocking {
      val baseUrl = baseUrlManager.getBaseUrl()
      val newUrl = request.url.toString().replace("http://__url__", baseUrl)
      newRequestBuilder
        .url(newUrl)
        .build()
    }
    return chain.proceed(newRequest)
  }
}