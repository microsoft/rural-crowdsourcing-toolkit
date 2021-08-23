package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.microsoft.research.karya.data.exceptions.NoWorkerException
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import javax.inject.Inject

class AuthManager
@Inject
constructor(
  private val applicationContext: Context,
  private val workerRepository: WorkerRepository,
  private val defaultDispatcher: CoroutineDispatcher = Dispatchers.IO,
) {
  private lateinit var activeWorker: String

  companion object {
    private val _sessionAlive = MutableLiveData<Boolean>(false)
    val sessionAlive: LiveData<Boolean>
      get() = _sessionAlive

    fun expireSession() {
      _sessionAlive.postValue(false)
    }

    fun startSession() {
      _sessionAlive.value = true
    }

  }

  suspend fun fetchLoggedInWorkerIdToken(): String {
    val worker = fetchLoggedInWorker()

    return worker.idToken ?: throw NoWorkerException()
  }

  suspend fun fetchLoggedInWorkerAccessCode(): String {
    if (!this::activeWorker.isInitialized || activeWorker.isEmpty()) {
      activeWorker = getLoggedInWorkerAccessCode()
    }

    return activeWorker
  }

  suspend fun isWorkerRegistered(): Boolean {
    if (!this::activeWorker.isInitialized || activeWorker.isEmpty()) {
      activeWorker = getLoggedInWorkerAccessCode()
    }

    val worker = workerRepository.getWorkerByAccessCode(activeWorker) ?: throw NoWorkerException()
    return !worker.idToken.isNullOrEmpty()
  }

  suspend fun updateLoggedInWorker(accessCode: String) {
    check(accessCode.isNotEmpty()) { "accessCode cannot be null" }
    activeWorker = accessCode
    setLoggedInWorkerAccessCode(accessCode)
  }

  suspend fun logoutWorker() =
      withContext(defaultDispatcher) {
        val accessCodeKey = stringPreferencesKey(PreferenceKeys.WORKER_ACCESS_CODE)
        applicationContext.dataStore.edit { prefs -> prefs.remove(accessCodeKey) }
        _sessionAlive.value = false
      }

  suspend fun fetchLoggedInWorker(): WorkerRecord {
    if (!this::activeWorker.isInitialized || activeWorker.isEmpty()) {
      activeWorker = getLoggedInWorkerAccessCode()
    }

    return workerRepository.getWorkerByAccessCode(activeWorker) ?: throw NoWorkerException()
  }

  private suspend fun setLoggedInWorkerAccessCode(accessCode: String) =
      withContext(defaultDispatcher) {
        val accessCodeKey = stringPreferencesKey(PreferenceKeys.WORKER_ACCESS_CODE)
        applicationContext.dataStore.edit { prefs -> prefs[accessCodeKey] = accessCode }
      }

  private suspend fun getLoggedInWorkerAccessCode(): String =
      withContext(defaultDispatcher) {
        val accessCodeKey = stringPreferencesKey(PreferenceKeys.WORKER_ACCESS_CODE)
        val data = applicationContext.dataStore.data.first()

        return@withContext data[accessCodeKey] ?: throw NoWorkerException()
      }
}
