// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Exception raised when access code is already used

package com.microsoft.research.karya.data.exceptions

import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.exceptions.KaryaException

class AccessCodeAlreadyUsedException : KaryaException(R.string.access_code_already_used)