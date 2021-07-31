package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.manager.NgDelegatingWorkerFactory
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
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
    taskRepository: TaskRepository,
    assignmentRepository: AssignmentRepository,
    karyaFileRepository: KaryaFileRepository,
    microTaskRepository: MicroTaskRepository,
    @FilesDir fileDirPath: String,
    authManager: AuthManager,
  ): NgDelegatingWorkerFactory {
    val workerFactory = NgDelegatingWorkerFactory(
      taskRepository,
      assignmentRepository,
      karyaFileRepository,
      microTaskRepository,
      fileDirPath,
      authManager
    )

    return workerFactory
  }
}