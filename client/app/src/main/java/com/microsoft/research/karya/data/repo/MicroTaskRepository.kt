package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.service.MicroTaskAPI
import kotlinx.coroutines.flow.flow
import okhttp3.MultipartBody
import javax.inject.Inject

class MicroTaskRepository @Inject constructor(private val microTaskAPI: MicroTaskAPI) {

    fun downloadInputFile(authProvider: String, idToken: String, assignmentId: String) = flow {
        val response = microTaskAPI.getInputFileForAssignment(authProvider, idToken, assignmentId)
        val file = response.body()

        if (!response.isSuccessful) {
            error("Failed to download file")
        }

        if (file != null) {
            emit(file)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun uploadOutputFile(
        authProvider: String,
        idToken: String,
        assignmentId: String,
        json: MultipartBody.Part,
        file: MultipartBody.Part
    ) = flow {
        val response = microTaskAPI.postUploads(authProvider, idToken, assignmentId, json, file)
        val karyaFileRecord = response.body()

        if (!response.isSuccessful) {
            error("Failed to upload file")
        }

        if (karyaFileRecord != null) {
            emit(karyaFileRecord)
        } else {
            error("Request failed, response body was null")
        }
    }
}
