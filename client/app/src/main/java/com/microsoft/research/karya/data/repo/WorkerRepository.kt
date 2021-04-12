package com.microsoft.research.karya.data.repo

import com.google.gson.JsonObject
import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerObject
import com.microsoft.research.karya.data.service.WorkerAPI
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import javax.inject.Inject

class WorkerRepository @Inject constructor(private val workerAPI: WorkerAPI, private val workerDao: WorkerDao) {

    fun getOrVerifyOTP(
        accessCode: String,
        phoneNumber: String,
        otp: String,
        action: String,
        workerRecordId: String
    ) = flow {
        val response = workerAPI.getOrVerifyOTP(
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
        val response = workerAPI.getWorkerUsingAccessCode(accessCode)
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
        val response = workerAPI.getWorkerUsingIdToken(idToken)
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
        val response = workerAPI.updateWorker(idToken, workerRecordId, worker)
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

    suspend fun getAllWorkers() = withContext(Dispatchers.IO) {
        return@withContext workerDao.getAll()
    }

    suspend fun getWorkerById(id: String) = withContext(Dispatchers.IO) {
        return@withContext workerDao.getById(id)
    }

}
