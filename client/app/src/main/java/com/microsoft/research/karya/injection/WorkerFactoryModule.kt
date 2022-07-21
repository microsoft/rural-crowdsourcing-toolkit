package com.microsoft.research.karya.injection

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.manager.SyncDelegatingWorkerFactory
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class WorkerFactoryModule {

  @Provides
  @Singleton
  fun providesNgWorkerFactory(
    assignmentRepository: AssignmentRepository,
    karyaFileRepository: KaryaFileRepository,
    microTaskRepository: MicroTaskRepository,
    paymentRepository: PaymentRepository,
    datastore: DataStore<Preferences>,
    @FilesDir fileDirPath: String,
    authManager: AuthManager,
  ): SyncDelegatingWorkerFactory {
    val workerFactory =
      SyncDelegatingWorkerFactory(
        assignmentRepository,
        karyaFileRepository,
        microTaskRepository,
        paymentRepository,
        datastore,
        fileDirPath,
        authManager
      )

    return workerFactory
  }
}
