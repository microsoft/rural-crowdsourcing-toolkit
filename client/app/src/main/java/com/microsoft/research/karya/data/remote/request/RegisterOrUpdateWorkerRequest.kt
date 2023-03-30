// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.remote.request

data class RegisterOrUpdateWorkerRequest(
  var year_of_birth: String,
  var gender: String,
)
