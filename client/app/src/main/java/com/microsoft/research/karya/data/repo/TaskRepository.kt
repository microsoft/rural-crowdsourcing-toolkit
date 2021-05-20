package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow

class TaskRepository
@Inject
constructor(
  private val taskDao: TaskDao,
  private val microTaskAssignmentDao: MicroTaskAssignmentDao,
) {
  fun getTaskInfoAsFlow(): Flow<List<TaskInfo>> = microTaskAssignmentDao.getTaskInfoFlow()
}
