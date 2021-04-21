// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// We are also checking here the validity of the tokenId of the user,
// once we do it we execute the request

package com.microsoft.research.karya.common

import android.os.Bundle
import android.util.Base64
import android.util.Log
import android.view.View
import com.google.gson.Gson
import com.microsoft.research.karya.R
import com.microsoft.research.karya.database.modelsExtra.IDToken
import java.lang.Exception
import kotlinx.android.synthetic.main.activity_network_activity.*
import kotlinx.coroutines.launch

/** Day in seconds. To check if token refresh is needed */
private const val DAY45_IN_SECONDS = 45 * 24 * 60 * 60

abstract class NetworkActivity(
    private val indeterminateProgress: Boolean = true,
    private val noMessage: Boolean = false,
    private val allowRetry: Boolean = false,
    private val needIdToken: Boolean = false
) : BaseActivity() {

  protected var networkRequestMessage: String = ""
  protected var networkErrorMessage: String = ""
  protected var networkRetryMessage: String = ""
  private var internetErrorMessage: String = ""
  private var generalRetryMessage: String = ""

  override fun onCreate(savedInstanceState: Bundle?) {
    setContentView(R.layout.activity_network_activity)
    super.onCreate(savedInstanceState)

    /** Set the onclick listener for the retry button */
    networkRequestRetryBtn.setOnClickListener { sendNetworkRequest() }

    /** Set progress bar type */
    networkRequestPb.isIndeterminate = indeterminateProgress
  }

  override fun onResume() {
    super.onResume()

    ioScope.launch {
      getStringsJob.join() // Just update the app strings if there is a language change

      if (appLanguageId != null) {
        internetErrorMessage = getValueFromName(R.string.no_internet_or_server_down)
        generalRetryMessage = getValueFromName(R.string.click_to_retry)
        networkErrorMessage = internetErrorMessage
        networkRetryMessage = generalRetryMessage
      }

      /** Send the request */
      sendNetworkRequest() // Why do we need to send a network request here ???
    }
  }

  /** Set the UI strings for the activity */
  override suspend fun setInitialUIStrings() {
    networkRequestMessageTv.text = networkRequestMessage
    if (noMessage) networkRequestMessageTv.visibility = View.GONE
  }

  /** Function to execute the network request. Called within an IO scope. */
  abstract suspend fun executeRequest()

  /**
   * Function to start the next activity. Called right after executing network request in UI scope.
   */
  abstract fun startNextActivity()

  /** Wrapper function to execute the request */
  private fun sendNetworkRequest() {
    resetError()
    var success = true
    val networkRequestJob =
        ioScope.launch {
          try {
            if (needIdToken) {
              checkIdToken()
            }
            Log.i("BEFORE_SEND_REQUEST", "SENDING REQUEST")
            executeRequest()
          } catch (exception: Exception) {
            success = false
            // TODO: Set a good error message., maybe by passing an error message inside the
            // function?
            setErrorMessage()
            Log.d("CUSTOM_DEBUG", exception.toString())
          }
        }

    uiScope.launch {
      networkRequestJob.join()
      if (success) {
        startNextActivity()
      }
    }
  }

  /** Function to set the error message and retry message */
  protected open fun setErrorMessage() {
    uiScope.launch {
      networkRequestErrorTv.visibility = View.VISIBLE
      networkRequestErrorTv.text = networkErrorMessage
      networkRequestPb.isIndeterminate = false
      if (allowRetry) {
        networkRequestRetryBtn.visibility = View.VISIBLE
        networkRequestRetryTv.text = networkRetryMessage
      }
    }
  }

  /** Function to reset the error message */
  private fun resetError() {
    uiScope.launch {
      networkRequestPb.isIndeterminate = indeterminateProgress
      networkRequestErrorTv.visibility = View.GONE
      networkRequestRetryBtn.visibility = View.GONE
    }
  }

  /**
   * Check the Id token of the worker. If it was created more than a day ago, refresh. If it has
   * expired, then request for new token.
   */
  private suspend fun checkIdToken() {
    /** Extract the created time from id token */
    val idToken = thisWorker.id_token!!
    val body = getPayload(idToken)

    Log.i("ANURAG_IDTOKEN", "$idToken  $body")

    /** Compare with current time */
    val current = System.currentTimeMillis() / 1000
    if (current - body.iat > DAY45_IN_SECONDS || current > body.exp) {
      val updatedWorkerResponse =
          karyaAPI.refreshIdToken(thisWorker.auth_provider.toString(), thisWorker.id_token!!)
      if (updatedWorkerResponse.isSuccessful) {
        val updatedWorker = updatedWorkerResponse.body()!!
        val newToken = updatedWorker.id_token!!
        karyaDb.workerDaoExtra().updateIdToken(newToken)
        thisWorker.id_token = newToken
      } else {
        throw Exception("Could not refresh ID Token")
      }
    }
  }

  /** Get payload from a [idToken] */
  private fun getPayload(idToken: String): IDToken {
    val fields = idToken.split(".")
    val bodyString = Base64.decode(fields[1], Base64.URL_SAFE).toString(Charsets.UTF_8)
    return Gson().fromJson(bodyString, IDToken::class.java)
  }
}
