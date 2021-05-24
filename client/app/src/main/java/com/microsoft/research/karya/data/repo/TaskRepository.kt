package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class TaskRepository
@Inject
constructor(
  private val taskDao: TaskDao,
  private val microTaskAssignmentDao: MicroTaskAssignmentDao,
) {
  suspend fun getTaskInfo(): List<TaskInfo> = withContext(Dispatchers.IO) { microTaskAssignmentDao.getTaskInfo() }
}
