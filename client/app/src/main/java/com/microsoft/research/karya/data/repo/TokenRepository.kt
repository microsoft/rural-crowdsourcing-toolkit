package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.WorkerDao
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject

class TokenRepository @Inject constructor(private val workerDao: WorkerDao) {

  suspend fun renewIdToken(id: String, newIdToken: String) =
      withContext(Dispatchers.IO) {
        val worker = workerDao.getById(id)
        val updatedWorker = worker!!.copy(idToken = newIdToken)
        workerDao.upsert(updatedWorker)
      }

}
