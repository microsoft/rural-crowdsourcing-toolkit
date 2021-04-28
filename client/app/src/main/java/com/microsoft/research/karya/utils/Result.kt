package com.microsoft.research.karya.utils

import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.AccessCodeAlreadyUsedException
import com.microsoft.research.karya.data.exceptions.IncorrectAccessCodeException
import com.microsoft.research.karya.data.exceptions.IncorrectOtpException
import com.microsoft.research.karya.data.exceptions.UnknownException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

sealed class Result {
  class Success<T>(val value: T) : Result()
  class Error(val exception: Throwable) : Result() {
    val errorMessageId =
        when (exception) {
          is UnknownHostException -> R.string.s_no_internet_or_server_down
          is SocketTimeoutException -> R.string.s_no_internet_or_server_down
          // Socket Timeout may also happen due to bad internet connection, maybe indicate in the
          // string?
          is AccessCodeAlreadyUsedException -> R.string.s_phone_number_already_used
          is IncorrectAccessCodeException -> R.string.s_invalid_creation_code
          is IncorrectOtpException -> R.string.s_invalid_otp
          is UnknownException -> R.string.s_unknown_error
          else -> R.string.s_unknown_error
        }
  }
  object Loading : Result()
}
