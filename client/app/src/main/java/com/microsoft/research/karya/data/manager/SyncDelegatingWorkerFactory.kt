package com.microsoft.research.karya.data.manager

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.work.DelegatingWorkerFactory
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import javax.inject.Inject

class SyncDelegatingWorkerFactory
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  karyaFileRepository: KaryaFileRepository,
  microTaskRepository: MicroTaskRepository,
  paymentRepository: PaymentRepository,
  workerRepository: WorkerRepository,
  @FilesDir private val fileDirPath: String,
  authManager: AuthManager,
) : DelegatingWorkerFactory() {
  init {
    addFactory(WorkerFactory(
      assignmentRepository,
      karyaFileRepository,
      microTaskRepository,
      paymentRepository,
      workerRepository,
      fileDirPath,
      authManager))
    // Add here other factories that you may need in your application
  }
}
