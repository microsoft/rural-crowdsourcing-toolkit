package com.microsoft.research.karya.ui.dashboard

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskStatus
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.utils.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel
@Inject
constructor(
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
  private val authManager: AuthManager,
  private val datastore: DataStore<Preferences>
) : ViewModel() {

  private var taskInfoList = listOf<TaskInfo>()
  private val taskInfoComparator =
    compareByDescending<TaskInfo> { taskInfo -> taskInfo.taskStatus.assignedMicrotasks }
      .thenByDescending { taskInfo -> taskInfo.taskStatus.skippedMicrotasks }
      .thenBy { taskInfo -> taskInfo.taskID }

  private val _dashboardUiState: MutableStateFlow<DashboardUiState> =
    MutableStateFlow(DashboardUiState.Success(DashboardStateSuccess(emptyList())))
  val dashboardUiState = _dashboardUiState.asStateFlow()

  private val _progress: MutableStateFlow<Int> = MutableStateFlow(0)
  val progress = _progress.asStateFlow()

  private val _workerAccessCode: MutableStateFlow<String> = MutableStateFlow("")
  val workerAccessCode = _workerAccessCode.asStateFlow()

  // Work from center user
  private val _workFromCenterUser: MutableStateFlow<Boolean> = MutableStateFlow(false)
  val workFromCenterUser = _workFromCenterUser.asStateFlow()
  private val _userInCenter: MutableStateFlow<Boolean> = MutableStateFlow(false)
  val userInCenter = _userInCenter.asStateFlow()

  init {
    viewModelScope.launch {
      val worker = authManager.getLoggedInWorker()
      _workerAccessCode.value = worker.accessCode

      try {
        if (worker.params != null && !worker.params.isJsonNull) {
          val tags = worker.params.asJsonObject.getAsJsonArray("tags")
          for (tag in tags) {
            if (tag.asString == "_wfc_") {
              _workFromCenterUser.value = true
              checkWorkFromCenterUserAuth()
            }
          }
        }
      } catch (e: Exception) {
        _workFromCenterUser.value = false
      }
    }
  }

  fun authorizeWorkFromCenterUser(code: String) {
    viewModelScope.launch {
      val isAuthenticated = authManager.authorizeWorkFromCenterUser(code)
      if (isAuthenticated) {
        _userInCenter.value = true
      }
    }
  }

  suspend fun revokeWFCAuthorization() {
    authManager.revokeWFCAuthorization()
    _userInCenter.value = false
  }

  suspend fun checkWorkFromCenterUserAuth(): Boolean {
    val isAuthenticated = authManager.isWorkFromCenterAuthenticated()
    if (isAuthenticated) _userInCenter.value = true
    return _userInCenter.value
  }

  suspend fun refreshList() {
    val worker = authManager.getLoggedInWorker()
    val tempList = mutableListOf<TaskInfo>()

    // Get task report summary
    val taskSummary = assignmentRepository.getTaskReportSummary(worker.id)

    taskInfoList.forEach { taskInfo ->
      val taskId = taskInfo.taskID
      val taskStatus = fetchTaskStatus(taskId)
      val summary = if (taskSummary.containsKey(taskId)) taskSummary[taskId] else null
      tempList.add(
        TaskInfo(
          taskInfo.taskID,
          taskInfo.taskName,
          taskInfo.taskInstruction,
          taskInfo.scenarioName,
          taskStatus,
          taskInfo.isGradeCard,
          summary
        )
      )
    }
    taskInfoList = tempList.sortedWith(taskInfoComparator)

    val success =
      DashboardUiState.Success(
        DashboardStateSuccess(taskInfoList.sortedWith(taskInfoComparator))
      )
    _dashboardUiState.value = success
  }

  /**
   * Returns a hot flow connected to the DB
   * @return [Flow] of list of [TaskRecord] wrapper in a [Result]
   */
  @Suppress("USELESS_CAST")
  fun getAllTasks() {
    viewModelScope.launch {
      val worker = authManager.getLoggedInWorker()

      taskRepository
        .getAllTasksFlow()
        .flowOn(Dispatchers.IO)
        .onEach { taskList ->

          // Get task report summary
          val taskSummary = assignmentRepository.getTaskReportSummary(worker.id)

          val tempList = mutableListOf<TaskInfo>()
          taskList.forEach { taskRecord ->
            val taskInstruction = try {
              taskRecord.params.asJsonObject.get("instruction").asString
            } catch (e: Exception) {
              null
            }
            val taskId = taskRecord.id
            val taskStatus = fetchTaskStatus(taskId)
            val summary = if (taskSummary.containsKey(taskId)) taskSummary[taskId] else null

            tempList.add(
              TaskInfo(
                taskRecord.id,
                taskRecord.display_name,
                taskInstruction,
                taskRecord.scenario_name,
                taskStatus,
                false,
                summary
              )
            )
          }
          taskInfoList = tempList

          val success =
            DashboardUiState.Success(
              DashboardStateSuccess(taskInfoList.sortedWith(taskInfoComparator))
            )
          _dashboardUiState.value = success
        }
        .catch { _dashboardUiState.value = DashboardUiState.Error(it) }
        .collect()
    }
  }

  fun setLoading() {
    _dashboardUiState.value = DashboardUiState.Loading
  }

  private suspend fun fetchTaskStatus(taskId: String): TaskStatus {
    return taskRepository.getTaskStatus(taskId)
  }

  fun setProgress(i: Int) {
    _progress.value = i
  }
}
