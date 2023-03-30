package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.service.LanguageAPI
import javax.inject.Inject
import kotlinx.coroutines.flow.flow

class LanguageRepository
@Inject
constructor(
  private val languageAPI: LanguageAPI,
) {

  fun getLanguageAssets(accessCode: String, languageCode: String) = flow {
    val response = languageAPI.getLanguageAssets(accessCode, languageCode)

    if (!response.isSuccessful) {
      error("Failed to get file")
    }

    emit(response)
  }
}
