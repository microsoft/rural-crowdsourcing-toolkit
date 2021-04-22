package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.LanguageDao
import com.microsoft.research.karya.data.model.karya.LanguageRecord
import com.microsoft.research.karya.data.service.LanguageAPI
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import javax.inject.Inject

class LanguageRepository @Inject constructor(
    private val languageAPI: LanguageAPI,
    private val languageDao: LanguageDao,
) {
    fun getLanguages(accessCode: String) = flow {
        val response = languageAPI.getLanguages(accessCode)
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

    suspend fun getLanguageById(id: Int) = withContext(Dispatchers.IO) {
        languageDao.getById(id)
    }

    suspend fun upsertLanguageRecords(records: List<LanguageRecord>) = withContext(Dispatchers.IO) {
        languageDao.upsert(records)
    }

}
