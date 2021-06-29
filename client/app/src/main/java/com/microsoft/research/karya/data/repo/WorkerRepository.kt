package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.exceptions.IncorrectAccessCodeException
import com.microsoft.research.karya.data.exceptions.IncorrectOtpException
import com.microsoft.research.karya.data.exceptions.PhoneNumberAlreadyUsedException
import com.microsoft.research.karya.data.exceptions.UnknownException
import com.microsoft.research.karya.data.local.ng.WorkerDao
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.remote.request.RegisterOrUpdateWorkerRequest
import com.microsoft.research.karya.data.service.WorkerAPI
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext

class WorkerRepository @Inject constructor(private val workerAPI: WorkerAPI, private val workerDao: WorkerDao) {

  private var isCacheInvalid: Boolean = true
  private val workerCache: MutableMap<String, WorkerRecord> = mutableMapOf()

  fun getOTP(
    accessCode: String,
    phoneNumber: String,
  ) = flow {
    val response = workerAPI.generateOTP(accessCode, phoneNumber)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
        404 -> IncorrectOtpException("Incorrect OTP")
        403 -> PhoneNumberAlreadyUsedException("Phone Number is Already in use")
        401 -> IncorrectAccessCodeException("Access Code is incorrect")
        else -> UnknownException("Something went wrong")
      }
    }

    if (workerRecord == null) {
      error("Request failed, response body was null")
    }

    // emit unit at the end to indicate success
    // TODO: think if we should use suspend fun instead of a flow
    emit(Unit)
  }

  fun resendOTP(
    accessCode: String,
    phoneNumber: String,
  ) = flow {
    val response = workerAPI.resendOTP(accessCode, phoneNumber)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
        404 -> IncorrectOtpException("Incorrect OTP")
        403 -> PhoneNumberAlreadyUsedException("Phone Number is Already in use")
        401 -> IncorrectAccessCodeException("Access Code is incorrect")
        else -> UnknownException("Something went wrong")
      }
    }

    if (workerRecord == null) {
      error("Request failed, response body was null")
    }

    emit(Unit)
  }

  fun verifyOTP(
    accessCode: String,
    phoneNumber: String,
    otp: String,
  ) = flow {
    val response = workerAPI.verifyOTP(accessCode, phoneNumber, otp)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
        404 -> IncorrectOtpException("Incorrect OTP")
        403 -> PhoneNumberAlreadyUsedException("Phone Number is Already in use")
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

  fun verifyAccessCode(accessCode: String) = flow {
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
    idToken: String,
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
    accessCode: String,
    registerOrUpdateWorkerRequest: RegisterOrUpdateWorkerRequest,
  ) = flow {
    val response = workerAPI.updateWorker(idToken, registerOrUpdateWorkerRequest, "register")
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
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

  fun updateWorker(
    idToken: String,
    worker: WorkerRecord,
  ) = flow {
    val response = workerAPI.updateWorker(idToken, worker)
    val workerRecord = response.body()

    if (!response.isSuccessful) {
      throw when (response.code()) {
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

  suspend fun getAllWorkers() =
    withContext(Dispatchers.IO) {
      updateWorkerCacheIfRequired()
      return@withContext workerCache.values.toList()
    }

  suspend fun getWorkerById(id: String) =
    withContext(Dispatchers.IO) {
      updateWorkerCacheIfRequired()
      workerCache.forEach { (_, worker) ->
        if (worker.id == id) {
          return@withContext worker
        }
      }
      return@withContext null
    }

  suspend fun getWorkerByAccessCode(accessCode: String) =
    withContext(Dispatchers.IO) {
      updateWorkerCacheIfRequired()
      return@withContext workerCache[accessCode]
    }

  suspend fun upsertWorker(worker: WorkerRecord) =
    withContext(Dispatchers.IO) {
      isCacheInvalid = true
      workerDao.upsert(worker)
    }

  private suspend fun updateWorkerCacheIfRequired() {
    withContext(Dispatchers.IO) {
      if (isCacheInvalid) {
        val workers = workerDao.getAll()
        workers.forEach { worker -> workerCache[worker.accessCode] = worker }
      }
      isCacheInvalid = false
    }
  }
}
