package com.microsoft.research.karya.data.remote.interceptors

import com.microsoft.research.karya.data.model.karya.modelsExtra.IDToken
import okhttp3.Interceptor
import okhttp3.Response
import android.util.Base64
import com.google.gson.Gson
import com.microsoft.research.karya.data.manager.AuthManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/** Day in seconds. To check if token refresh is needed */
private const val DAY7_IN_SECONDS = 7 * 24 * 60 * 60

class IdTokenRenewInterceptor(): Interceptor {
  private val ioScope = CoroutineScope(Dispatchers.IO)

  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val requestBuilder = request.newBuilder()
    val idToken = request.header("karya-id-token") ?: return chain.proceed(requestBuilder.build())
    val body = getPayload(idToken)
    val current = System.currentTimeMillis() / 1000
    // If it has been 7 days since issuing the token, refresh
//    if (current - body.iat > DAY7_IN_SECONDS) {
//      refreshToken()
//    }
    if (current > body.exp) {
      ioScope.launch {
        AuthManager.expireSession()
      }
    }
    return chain.proceed(requestBuilder.build())
  }

  /**
   * Get payload from a [idToken]
   */
  private fun getPayload(idToken: String): IDToken {
    val fields = idToken.split(".")
    val bodyString = Base64.decode(fields[1], Base64.URL_SAFE).toString(Charsets.UTF_8)
    return Gson().fromJson(bodyString, IDToken::class.java)
  }

}
