package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskStatus
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow

class TaskRepository
@Inject
constructor(
  private val taskDao: TaskDao,
  private val microTaskAssignmentDao: MicroTaskAssignmentDao,
) {
  fun getAllTasksFlow(): Flow<List<TaskRecord>> = taskDao.getAllAsFlow()

  suspend fun getTaskStatus(taskId: String): TaskStatus {
    val available = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.assigned)
    val completed = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.completed)
    val submitted = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.submitted)
    val verified = microTaskAssignmentDao.getCountForTask(taskId, MicrotaskAssignmentStatus.verified)

    return TaskStatus(available, completed, submitted, verified)
  }
}
