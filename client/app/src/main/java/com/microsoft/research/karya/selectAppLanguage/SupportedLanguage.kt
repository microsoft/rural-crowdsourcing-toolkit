// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.selectAppLanguage

/** Data class for displaying supported languages */
data class SupportedLanguage(
    val id: Int,
    val name: String,
    val prompt: String,
    var showPointer: Boolean
)
