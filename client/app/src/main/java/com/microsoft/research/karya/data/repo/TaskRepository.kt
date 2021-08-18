package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskStatus
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class TaskRepository
@Inject
constructor(
  private val taskDao: TaskDao,
  private val microTaskAssignmentDao: MicroTaskAssignmentDao,
) {
  suspend fun getById(taskId: String): TaskRecord {
    return taskDao.getById(taskId)
  }

  fun getAllTasksFlow(): Flow<List<TaskRecord>> = taskDao.getAllAsFlow()

  suspend fun getTaskStatus(taskId: String): TaskStatus {
    val available = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.ASSIGNED)
    val completed = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.COMPLETED)
    val submitted = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.SUBMITTED)
    val verified = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.VERIFIED)
    val skipped = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.SKIPPED)

    return TaskStatus(available, completed, submitted, verified, skipped)
  }

}
