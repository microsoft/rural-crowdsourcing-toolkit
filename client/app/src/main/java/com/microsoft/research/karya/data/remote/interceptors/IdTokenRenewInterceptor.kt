package com.microsoft.research.karya.data.remote.interceptors

import android.util.Base64
import com.google.gson.Gson
import com.microsoft.research.karya.data.manager.NgAuthManager
import com.microsoft.research.karya.data.model.karya.modelsExtra.IDToken
import com.microsoft.research.karya.data.repo.AuthRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import org.json.JSONObject

/** Day in seconds. To check if token refresh is needed */
private const val DAY7_IN_SECONDS = 7 * 24 * 60 * 60
private const val ID_TOKEN_HEADER = "karya-id-token"

class IdTokenRenewInterceptor(val authRepository: AuthRepository, val authManager: NgAuthManager, val baseUrl: String) :
  Interceptor {
  private val ioScope = CoroutineScope(Dispatchers.IO)

  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val requestBuilder = request.newBuilder()
    val idToken = request.header(ID_TOKEN_HEADER) ?: return chain.proceed(requestBuilder.build())
    val body = getPayload(idToken)
    val workerId = body.sub
    val current = System.currentTimeMillis() / 1000
    // If it has been 7 days since issuing the token, refresh

    if (current > body.exp) {
      ioScope.launch {
        authManager.expireSession()
      }
    }

    if (current - body.iat > DAY7_IN_SECONDS) {
      val authRequest = request.newBuilder()
        .url("${baseUrl}/renew_id_token")
        .get()
        .build()
      val tokenRefreshResponse = chain.proceed(authRequest)
      if (tokenRefreshResponse.isSuccessful) {
        val responseRaw = tokenRefreshResponse.body!!.string()
        val responseJson = JSONObject(responseRaw)
        val newIdToken = responseJson.getString("id_token")

        runBlocking {
          authRepository.renewIdToken(workerId, newIdToken)
        }
        return chain.proceed(
          requestBuilder
            .removeHeader(ID_TOKEN_HEADER)
            .addHeader(ID_TOKEN_HEADER, newIdToken)
            .build()
        )
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
