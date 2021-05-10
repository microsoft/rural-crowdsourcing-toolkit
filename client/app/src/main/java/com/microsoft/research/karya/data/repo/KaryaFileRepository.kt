package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.KaryaFileDao
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.service.KaryaFileAPI
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import okhttp3.MultipartBody

class KaryaFileRepository
@Inject
constructor(private val karyaFileAPI: KaryaFileAPI, private val karyaFileDao: KaryaFileDao) {

  fun uploadKaryaFile(idToken: String, json: MultipartBody.Part, file: MultipartBody.Part) = flow {
    val response = karyaFileAPI.uploadKaryaFile(idToken, json, file)
    val responseBody = response.body()

    if (!response.isSuccessful) {
      error("Failed to upload file")
    }

    if (responseBody != null) {
      emit(responseBody)
    } else {
      error("Request failed, response body was null")
    }
  }

  fun getKaryaFile(accessCode: String, idToken: String, karyaFileId: String) = flow {
    val response = karyaFileAPI.getKaryaFile(accessCode, idToken, karyaFileId)

    if (!response.isSuccessful) {
      error("Failed to get file")
    }

    emit(response)
  }

  suspend fun insertKaryaFile(karyaFileRecord: KaryaFileRecord) {
    withContext(Dispatchers.IO) { karyaFileDao.insert(karyaFileRecord) }
  }
}
