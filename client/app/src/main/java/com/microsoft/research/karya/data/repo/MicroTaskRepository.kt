package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskDaoExtra
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import javax.inject.Inject

class MicroTaskRepository
@Inject
constructor(
  private val microTaskDao: MicroTaskDao,
  private val microtaskDaoExtra: MicrotaskDaoExtra
) {

  suspend fun getSubmittedMicrotasksWithInputFiles(): List<String> {
    return microtaskDaoExtra.getSubmittedMicrotasksWithInputFiles()
  }

  suspend fun getById(microtaskId: String): MicroTaskRecord {
    return microTaskDao.getById(microtaskId)
  }
}
