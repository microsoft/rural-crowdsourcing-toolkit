package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.exceptions.IncorrectAccessCodeException
import com.microsoft.research.karya.data.exceptions.IncorrectOtpException
import com.microsoft.research.karya.data.exceptions.AccessCodeAlreadyUsedException
import com.microsoft.research.karya.data.exceptions.SessionExpiredException
import com.microsoft.research.karya.data.exceptions.UnknownException
import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import com.microsoft.research.karya.data.service.WorkerAPI
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext

class WorkerRepository
@Inject
constructor(private val workerAPI: WorkerAPI, private val workerDao: WorkerDao) {

  enum class OtpAction {
    GENERATE,
    RESEND,
    VERIFY
  }

  fun getOrVerifyOTP(
      accessCode: String,
      phoneNumber: String,
      otp: String,
      action: String,
  ) = flow {
    val response = workerAPI.getOrVerifyOTP(accessCode, phoneNumber, otp, action)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
        404 -> IncorrectOtpException("Incorrect OTP")
        403 -> AccessCodeAlreadyUsedException("Access Code is being used by another phone number")
        401 -> IncorrectAccessCodeException("Access Code is incorrect")
        else -> UnknownException("Something went wrong")
      }
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
        throw when (response.code()) {
            401 -> IncorrectAccessCodeException("Access Code is incorrect")
            else -> UnknownException("Something went wrong")
        }
    }

    if (responseBody != null) {
      emit(responseBody)
    } else {
      error("Request failed, response body was null")
    }
  }

  fun getWorkerUsingIdToken(
      idToken: String,
  ) = flow {
    val response = workerAPI.getWorkerUsingIdToken(idToken)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
        throw when (response.code()) {
            401 -> SessionExpiredException("Invalid id-token")
            else -> UnknownException("Something went wrong")
        }
    }

    if (workerRecord != null) {
      emit(workerRecord)
    } else {
      error("Request failed, response body was null")
    }
  }

  fun updateWorker(
      idToken: String,
      accessCode: String,
      registerOrUpdateWorkerRequest: RegisterOrUpdateWorkerRequest,
  ) = flow {
    val response = workerAPI.updateWorker(idToken, accessCode, registerOrUpdateWorkerRequest)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
        401 -> IncorrectAccessCodeException("Invalid Access Code or id token")
        else -> UnknownException("Something went wrong")
      }
    }

    if (workerRecord != null) {
      emit(workerRecord)
    } else {
      error("Request failed, response body was null")
    }
  }

  suspend fun getAllWorkers() =
      withContext(Dispatchers.IO) {
        return@withContext workerDao.getAll()
      }

  suspend fun getWorkerById(id: String) =
      withContext(Dispatchers.IO) {
        return@withContext workerDao.getById(id)
      }

  suspend fun upsertWorker(worker: WorkerRecord) =
      withContext(Dispatchers.IO) { workerDao.upsert(worker) }
}
