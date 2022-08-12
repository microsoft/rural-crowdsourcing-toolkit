package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.work.ListenableWorker
import androidx.work.WorkerFactory
import androidx.work.WorkerParameters
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.dashboard.DashboardSyncWorker

class WorkerFactory(
  private val assignmentRepository: AssignmentRepository,
  private val karyaFileRepository: KaryaFileRepository,
  private val microTaskRepository: MicroTaskRepository,
  private val paymentRepository: PaymentRepository,
  private val workerRepository: WorkerRepository,
  private val datastore: DataStore<Preferences>,
  @FilesDir private val fileDirPath: String,
  private val authManager: AuthManager,
) : WorkerFactory() {

  override fun createWorker(
    appContext: Context,
    workerClassName: String,
    workerParameters: WorkerParameters
  ): ListenableWorker? {

    return when (workerClassName) {
      DashboardSyncWorker::class.java.name ->
        DashboardSyncWorker(
          appContext,
          workerParameters,
          assignmentRepository,
          karyaFileRepository,
          microTaskRepository,
          paymentRepository,
          workerRepository,
          datastore,
          fileDirPath,
          authManager
        )
      else ->
        // Return null, so that the base class can delegate to the default WorkerFactory.
        null
    }
  }
}
