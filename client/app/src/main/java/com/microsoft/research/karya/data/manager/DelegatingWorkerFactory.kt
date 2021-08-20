package com.microsoft.research.karya.data.manager

import androidx.work.DelegatingWorkerFactory
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import javax.inject.Inject

class NgDelegatingWorkerFactory @Inject
constructor(
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
  private val karyaFileRepository: KaryaFileRepository,
  private val microTaskRepository: MicroTaskRepository,
  @FilesDir private val fileDirPath: String,
  private val authManager: AuthManager,
) : DelegatingWorkerFactory() {
  init {
    addFactory(
      WorkerFactory(
        taskRepository,
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