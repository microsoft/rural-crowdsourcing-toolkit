package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.microsoft.research.karya.data.exceptions.NoWorkerException
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.AuthRepository
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import javax.inject.Inject

enum class AUTH_STATUS {
  LOGGED_IN, AUTHENTICATED, UNAUTHENTICATED, LOGGED_OUT
}

class AuthManager
@Inject
constructor(
  private val applicationContext: Context,
  private val authRepository: AuthRepository,
  private val defaultDispatcher: CoroutineDispatcher = Dispatchers.IO,
) {
  private lateinit var activeWorkerId: String
  private val ioScope = CoroutineScope(defaultDispatcher)

  private val _currAuthStatus = MutableLiveData(AUTH_STATUS.LOGGED_OUT)
  val currAuthStatus: LiveData<AUTH_STATUS>
    get() = _currAuthStatus

  suspend fun updateLoggedInWorker(workerId: String) {
    check(workerId.isNotEmpty()) { "accessCode cannot be null" }
    activeWorkerId = workerId
    setLoggedInWorkerID(workerId)
  }

  private suspend fun setLoggedInWorkerID(workerId: String) =
    withContext(defaultDispatcher) {
      val workerIdKey = stringPreferencesKey(PreferenceKeys.WORKER_ID)
      applicationContext.dataStore.edit { prefs -> prefs[workerIdKey] = workerId }
    }

  private suspend fun getLoggedInWorkerId(): String {
    if (!this::activeWorkerId.isInitialized || activeWorkerId.isEmpty()) {
      withContext(defaultDispatcher) {
        val workerIdKey = stringPreferencesKey(PreferenceKeys.WORKER_ID)
        val data = applicationContext.dataStore.data.first()
        activeWorkerId = data[workerIdKey] ?: throw NoWorkerException()
        resetAuthStatus()
      }
    }
    return activeWorkerId
  }

  private suspend fun resetAuthStatus() {
    try {
      val worker = getLoggedInWorker()
      if (worker.accessCode.isNotEmpty()) {
        if (!worker.idToken.isNullOrEmpty()) {
          setAuthStatus(AUTH_STATUS.AUTHENTICATED)
        } else {
          setAuthStatus(AUTH_STATUS.UNAUTHENTICATED)
        }
      } else {
        setAuthStatus(AUTH_STATUS.LOGGED_IN)
      }
    } catch (e: NoWorkerException) {
      setAuthStatus(AUTH_STATUS.LOGGED_OUT)
    }
  }

  suspend fun getLoggedInWorker(): WorkerRecord {
    if (!this::activeWorkerId.isInitialized || activeWorkerId.isEmpty()) {
      activeWorkerId = getLoggedInWorkerId()
    }

    return authRepository.getWorkerById(activeWorkerId) ?: throw NoWorkerException()
  }

  suspend fun getLoggedInWorkerAccessCode(): String {
    val worker = getLoggedInWorker()
    return worker.accessCode
  }

  suspend fun startSession(worker: WorkerRecord) {
    authRepository.updateAfterAuth(worker)
    setAuthStatus(AUTH_STATUS.AUTHENTICATED)
  }

  fun expireSession() {
    setAuthStatus(AUTH_STATUS.UNAUTHENTICATED)
  }

  private fun setAuthStatus(status: AUTH_STATUS) {
    _currAuthStatus.postValue(status)
  }

}