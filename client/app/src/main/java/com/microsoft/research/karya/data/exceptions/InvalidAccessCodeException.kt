// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Invalid access code exception

package com.microsoft.research.karya.data.exceptions

import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.KaryaException

class InvalidAccessCodeException : KaryaException(R.string.invalid_access_code)