package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class AuthRepository @Inject constructor(
  private val workerDao: WorkerDao
){
  suspend fun updateAfterAuth(worker: WorkerRecord) =
    withContext(Dispatchers.IO) { workerDao.upsert(worker) }

  suspend fun getWorkerById(id: String) =
    withContext(Dispatchers.IO) {
      return@withContext workerDao.getById(id)
    }

  suspend fun renewIdToken(id: String, newIdToken: String) =
    withContext(Dispatchers.IO) {
      val worker = workerDao.getById(id)
      val updatedWorker = worker!!.copy(idToken = newIdToken)
      workerDao.upsert(updatedWorker)
    }
}