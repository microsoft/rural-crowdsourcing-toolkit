// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import com.google.gson.JsonObject
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.NetworkActivity

class SendOTPActivity :
    NetworkActivity(indeterminateProgress = true, noMessage = false, allowRetry = true) {
  /** Fetch the request message string */
  override suspend fun getStringsForActivity() {
    networkRequestMessage = getValueFromName(R.string.sending_otp)
  }

  /** Execute the network request */
  override suspend fun executeRequest() {
    val worker = JsonObject()
    worker.addProperty("creation_code", WorkerInformation.creation_code)
    worker.addProperty("phone_number", WorkerInformation.phone_number)

    val sendOTPResponse = karyaAPI.sendOTP(worker)
    if (sendOTPResponse.isSuccessful) {
      val workerRecord = sendOTPResponse.body()!!
      WorkerInformation.otp = workerRecord.params.get("otp").asString
    } else {
      val networkErrorMessageName =
          getValueFromName(
              when (sendOTPResponse.code()) {
                400 -> R.string.unable_to_send_otp
                503 -> R.string.unable_to_send_otp
                409 -> R.string.phone_number_already_used
                else -> R.string.unknown_error
              })
      throw Exception()
    }
  }

  /** Start the next activity */
  override fun startNextActivity() {
    startActivity(Intent(applicationContext, OTPActivity::class.java))
  }
}
