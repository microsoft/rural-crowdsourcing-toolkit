// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.database.modelsExtra

import com.microsoft.research.karya.database.models.AuthProviderType

data class WorkerObject(
    var creation_code: String,
    var auth_provider: AuthProviderType,
    var phone_number: String,
    var age: String,
    var gender: String,
    var app_language: Int
)
