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
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
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

  private val _dashboardUiState: MutableStateFlow<DashboardUiState> =
    MutableStateFlow(DashboardUiState.Success(emptyList()))
  val dashboardUiState = _dashboardUiState.asStateFlow()

  fun fetchNewTasks() {
    viewModelScope.launch {
      val idToken = authManager.fetchLoggedInWorkerIdToken()

      assignmentRepository.getAssignments(idToken, "new", "").catch { Log.d("dashboard", it.message!!) }.collect()
    }
  }

  fun submitCompletedTasks() {
    viewModelScope.launch {
      val updates = assignmentRepository.getLocalCompletedAssignments()

      val idToken = authManager.fetchLoggedInWorkerIdToken()

      assignmentRepository.submitAssignments(idToken, updates)
        .onEach { assignmentIds ->
          assignmentRepository.markMicrotaskAssignmentsSubmitted(assignmentIds)
        }
        .catch { Log.d("dashboard submit task", it.message!!) }.collect()
    }
    // TODO: Pass error message to UI
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
  fun getAllTasks() {
    taskRepository
      .getAllTasksFlow()
      .onStart { _dashboardUiState.emit(DashboardUiState.Loading) }
      .onEach { taskList ->
        val taskInfoList = mutableListOf<TaskInfo>()

        taskList.forEach { taskRecord ->
          val taskStatus = fetchTaskStatus(taskRecord.id)
          taskInfoList.add(TaskInfo(taskRecord.id, taskRecord.name, taskRecord.scenario_id.toString(), taskStatus))
        }

        val success = DashboardUiState.Success(taskInfoList.sortedWith(taskInfoComparator))
        _dashboardUiState.emit(success)
      }
      .catch { throwable -> _dashboardUiState.emit(DashboardUiState.Error(throwable)) }
      .launchIn(viewModelScope)
  }

  private suspend fun fetchTaskStatus(taskId: String): TaskStatus {
    return taskRepository.getTaskStatus(taskId)
  }
}
