package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.service.LanguageAPI
import kotlinx.coroutines.flow.flow

class LanguageRepository(private val languageAPI: LanguageAPI) {
    fun getLanguages() = flow {
        val response = languageAPI.getLanguages()
        val languages = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (languages != null) {
            emit(languages)
        } else {
            error("Request failed, response body was null")
        }

    }
}