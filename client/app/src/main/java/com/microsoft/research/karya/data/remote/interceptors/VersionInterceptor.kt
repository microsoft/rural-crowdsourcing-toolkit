package com.microsoft.research.karya.data.remote.interceptors

import com.microsoft.research.karya.data.repo.TokenRepository
import okhttp3.Interceptor
import okhttp3.Response

class VersionInterceptor() : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    return chain.proceed(
      chain.request()
          .newBuilder()
          .addHeader("client-version-number", "5")
          .build()
    )
  }
}
