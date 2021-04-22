// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya.modelsExtra

data class IDToken(
    val id: String,
    val iat: Int,
    val exp: Int,
    val aud: String,
)
