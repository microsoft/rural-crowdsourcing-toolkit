package com.microsoft.research.karya.data.manager

import androidx.work.DelegatingWorkerFactory
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import javax.inject.Inject

class NgDelegatingWorkerFactory @Inject
constructor(
  assignmentRepository: AssignmentRepository,
  karyaFileRepository: KaryaFileRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir private val fileDirPath: String,
  authManager: AuthManager,
) : DelegatingWorkerFactory() {
  init {
    addFactory(NgWorkerFactory(
      assignmentRepository,
      karyaFileRepository,
      microTaskRepository,
      fileDirPath,
      authManager
      )
    )
    // Add here other factories that you may need in your application
  }
}
