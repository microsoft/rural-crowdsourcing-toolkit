package com.microsoft.research.karya.ui.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskStatus
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel
@Inject
constructor(
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
  private val microTaskRepository: MicroTaskRepository,
  private val authManager: AuthManager,
) : ViewModel() {

  private val taskInfoComparator =
    compareByDescending<TaskInfo> { taskInfo -> taskInfo.taskStatus.completedMicrotasks }.thenBy { taskInfo ->
      taskInfo.taskID
    }

  fun fetchNewTasks() {
    viewModelScope.launch {
      val idToken = authManager.fetchLoggedInWorkerIdToken()

      assignmentRepository.getAssignments(idToken, "new", "").catch { Log.d("dashboard", it.message!!) }.collect()
    }
  }

  fun fetchVerifiedTasks(from: String = "") {
    viewModelScope.launch {
      val idToken = authManager.fetchLoggedInWorkerIdToken()

      assignmentRepository
        .getAssignments(idToken, "verified", from)
        .catch { Log.d("dashboard", it.message!!) }
        .collect()
    }
  }

  /**
   * Returns a hot flow connected to the DB
   * @return [Flow] of list of [TaskRecord] wrapper in a [Result]
   */
  @Suppress("USELESS_CAST")
  fun getAllTasks(): Flow<Result> {
    return taskRepository
      .getAllTasksFlow()
      .map { taskList ->
        val taskInfoList = mutableListOf<TaskInfo>()

        taskList.forEach { taskRecord ->
          val taskStatus = fetchTaskStatus(taskRecord.id)
          taskInfoList.add(TaskInfo(taskRecord.id, taskRecord.name, taskRecord.scenario_id.toString(), taskStatus))
        }

        // Cast it to make sure we are returning a read only list
        taskInfoList.sortedWith(taskInfoComparator) as List<TaskInfo>
      }
      .mapToResult()
  }

  private suspend fun fetchTaskStatus(taskId: String): TaskStatus {
    return taskRepository.getTaskStatus(taskId)
  }
}
