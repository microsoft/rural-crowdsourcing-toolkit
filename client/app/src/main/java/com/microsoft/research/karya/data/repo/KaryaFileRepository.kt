package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.KaryaFileDao
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class KaryaFileRepository @Inject constructor(private val karyaFileDao: KaryaFileDao) {
  suspend fun insertKaryaFile(karyaFileRecord: KaryaFileRecord) {
    withContext(Dispatchers.IO) { karyaFileDao.insert(karyaFileRecord) }
  }
}
