package com.microsoft.research.karya.data.remote.response

data class ValidAccessCodeResponse(
    val id: String, // This would be later removed in the API, do not use this field
    val appLanguage: Int
)
