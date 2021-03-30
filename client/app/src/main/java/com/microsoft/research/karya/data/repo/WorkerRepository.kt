package com.microsoft.research.karya.data.repo

import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerObject
import com.microsoft.research.karya.data.service.WorkersAPI
import kotlinx.coroutines.flow.flow
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.Path

class WorkerRepository(private val workersAPI: WorkersAPI) {

    fun checkCreationCode(id: String) = flow {
        val response = workersAPI.checkCreationCode(id)

        val creationCodeResponse = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (creationCodeResponse != null) {
            emit(creationCodeResponse)
        } else {
            error("Request failed, response body was null")
        }

    }

    fun sendOTP(worker: JsonObject) = flow {
        val response = workersAPI.sendOTP(worker)

        val workerRecord = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (workerRecord != null) {
            emit(workerRecord)
        } else {
            error("Request failed, response body was null")
        }


    }

    fun resendOTP(worker: JsonObject) = flow {
        val response = workersAPI.resendOTP(worker)

        val workerRecord = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (workerRecord != null) {
            emit(workerRecord)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun updateWorkerUsingCreationCode(worker: WorkerObject) = flow {
        val response = workersAPI.updateWorkerUsingCreationCode(worker)

        val workerRecord = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (workerRecord != null) {
            emit(workerRecord)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun refreshIdToken(
        authProvider: String,
        idTokenHeader: String
    ) = flow {
        val response = workersAPI.refreshIdToken(authProvider, idTokenHeader)

        val workerRecord = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (workerRecord != null) {
            emit(workerRecord)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun registerSkill(
        skillObject: WorkerLanguageSkillObject,
        authProvider: String,
        idTokenHeader: String
    ) = flow {

        val response = workersAPI.registerSkill(skillObject, authProvider, idTokenHeader)

        val workerLanguageSkillRecord = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (workerLanguageSkillRecord != null) {
            emit(workerLanguageSkillRecord)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun updateSkill(
        skillObject: WorkerLanguageSkillObject,
        authProvider: String,
        idTokenHeader: String,
        workerLanguageSkillId: String
    ) = flow {
        val response = workersAPI.updateSkill(skillObject,
            authProvider,
            idTokenHeader,
            workerLanguageSkillId
            )

        val workerLanguageSkillRecord = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (workerLanguageSkillRecord != null) {
            emit(workerLanguageSkillRecord)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun getUpdates(
        authProvider: String,
        idTokenHeader: String,
        worker: WorkerRecord
    ) = flow {
        val response = workersAPI.getUpdates(authProvider,
            idTokenHeader,
            worker
        )

        val jsonArray = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (jsonArray != null) {
            emit(jsonArray)
        } else {
            error("Request failed, response body was null")
        }
    }


    fun getInputFileForAssignment(
        authProvider: String,
        idTokenHeader: String,
        microtaskAssignmentID: String
    ) = flow {
        val response = workersAPI.getInputFileForAssignment(authProvider,
            idTokenHeader,
            microtaskAssignmentID
        )

        val responseBody = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (responseBody != null) {
            emit(responseBody)
        } else {
            error("Request failed, response body was null")
        }
    }


}