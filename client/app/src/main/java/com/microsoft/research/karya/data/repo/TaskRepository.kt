package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.model.karya.TaskRecord
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow

class TaskRepository @Inject constructor(private val taskDao: TaskDao) {
  fun getAllTasksFlow(): Flow<List<TaskRecord>> = taskDao.getAllAsFlow()
}
