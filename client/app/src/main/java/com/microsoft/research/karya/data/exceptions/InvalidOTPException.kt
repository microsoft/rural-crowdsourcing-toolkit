// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Invalid OTP exception

package com.microsoft.research.karya.data.exceptions

import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.KaryaException

class InvalidOTPException : KaryaException(R.string.invalid_otp)