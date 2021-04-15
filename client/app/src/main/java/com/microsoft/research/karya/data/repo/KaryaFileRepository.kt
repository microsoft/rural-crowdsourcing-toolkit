package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.service.KaryaFileAPI
import kotlinx.coroutines.flow.flow
import okhttp3.MultipartBody
import javax.inject.Inject

class KaryaFileRepository @Inject constructor(private val karyaFileAPI: KaryaFileAPI) {

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

}
