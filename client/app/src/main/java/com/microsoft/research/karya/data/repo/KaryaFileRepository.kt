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
            error("Failed to get assignments")
        }

        if (responseBody != null) {
            emit(responseBody)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun getKaryaFile(idToken: String, karyaFileId: String) = flow {

        val response = karyaFileAPI.getKaryaFile(idToken, karyaFileId)
        val file = response.body()

        if (!response.isSuccessful) {
            error("Failed to get assignments")
        }

        if (file != null) {
            emit(file)
        } else {
            error("Request failed, response body was null")
        }
    }

}
