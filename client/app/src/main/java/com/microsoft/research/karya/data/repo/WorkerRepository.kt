package com.microsoft.research.karya.data.repo

import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerObject
import com.microsoft.research.karya.data.service.WorkersAPI
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

class WorkerRepository @Inject constructor(private val workersAPI: WorkersAPI) {

    fun getOrVerifyOTP(
        accessCode: String,
        phoneNumber: String,
        otp: String,
        action: String,
        workerRecordId: String
    ) = flow {
        val response = workersAPI.getOrVerifyOTP(
            accessCode,
            phoneNumber,
            otp,
            action,
            workerRecordId
        )
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

    fun getWorkerUsingAccessCode(accessCode: String) = flow {
        val response = workersAPI.getWorkerUsingAccessCode(accessCode)
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

    fun getWorkerUsingIdToken(
        idToken: String
    ) = flow {
        val response = workersAPI.getWorkerUsingIdToken(idToken)
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

    fun updateWorker(
        idToken: String,
        workerRecordId: String,
        worker: WorkerRecord
    ) = flow {
        val response = workersAPI.updateWorker(idToken, workerRecordId, worker)
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


}
