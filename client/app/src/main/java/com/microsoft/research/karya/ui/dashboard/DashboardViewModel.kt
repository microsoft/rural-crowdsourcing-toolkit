package com.microsoft.research.karya.ui.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskStatus
import com.microsoft.research.karya.data.remote.response.WorkerBalanceResponse
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.ui.payment.PaymentFlowNavigation
import com.microsoft.research.karya.utils.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel
@Inject
constructor(
    private val taskRepository: TaskRepository,
    private val assignmentRepository: AssignmentRepository,
    private val authManager: AuthManager,
    private val paymentRepository: PaymentRepository,
) : ViewModel() {

    private var taskInfoList = listOf<TaskInfo>()
    private val taskInfoComparator =
        compareByDescending<TaskInfo> { taskInfo -> taskInfo.taskStatus.assignedMicrotasks }.thenBy { taskInfo ->
            taskInfo.taskID
        }

    private val _dashboardUiState: MutableStateFlow<DashboardUiState> =
        MutableStateFlow(DashboardUiState.Success(DashboardStateSuccess(emptyList(), 0.0f)))
    val dashboardUiState = _dashboardUiState.asStateFlow()

    private val _navigationFlow = MutableSharedFlow<DashboardNavigation>()
    val navigationFlow = _navigationFlow.asSharedFlow()

    private val _progress: MutableStateFlow<Int> =
        MutableStateFlow(0)
    val progress = _progress.asStateFlow()

    suspend fun refreshList() {
        val worker = authManager.getLoggedInWorker()
        val tempList = mutableListOf<TaskInfo>()
        taskInfoList.forEach { taskInfo ->
            val taskStatus = fetchTaskStatus(taskInfo.taskID)
            tempList.add(
                TaskInfo(
                    taskInfo.taskID,
                    taskInfo.taskName,
                    taskInfo.scenarioName,
                    taskStatus,
                    taskInfo.isGradeCard
                )
            )
        }
        taskInfoList = tempList.sortedWith(taskInfoComparator)

        val totalCreditsEarned = getWorkerAccountInfo()
        _dashboardUiState.value =
            DashboardUiState.Success(DashboardStateSuccess(taskInfoList, totalCreditsEarned))
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
                    val tempList = mutableListOf<TaskInfo>()
                    taskList.forEach { taskRecord ->
                        val taskStatus = fetchTaskStatus(taskRecord.id)
                        if (taskRecord.scenario_name.equals("SIGN_LANGUAGE_VIDEO")) {
                            if (taskStatus.assignedMicrotasks > 0 || taskStatus.completedMicrotasks > 0) {
                                tempList.add(
                                    TaskInfo(
                                        taskRecord.id,
                                        taskRecord.display_name,
                                        taskRecord.scenario_name,
                                        taskStatus,
                                        false
                                    )
                                )
                            }
                            if (taskStatus.verifiedMicrotasks > 0) {
                                tempList.add(
                                    TaskInfo(
                                        taskRecord.id,
                                        "${taskRecord.display_name} (Grades)",
                                        taskRecord.scenario_name,
                                        taskStatus,
                                        true
                                    )
                                )
                            }
                        } else {
                            tempList.add(
                                TaskInfo(
                                    taskRecord.id,
                                    taskRecord.display_name,
                                    taskRecord.scenario_name,
                                    taskStatus,
                                    false
                                )
                            )
                        }
                    }
                    taskInfoList = tempList

                    val totalCreditsEarned = getWorkerAccountInfo()
                    val success =
                        DashboardUiState.Success(
                            DashboardStateSuccess(taskInfoList.sortedWith(taskInfoComparator), totalCreditsEarned)
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

    fun updateTaskStatus(taskId: String) {
        viewModelScope.launch {
            val worker = authManager.getLoggedInWorker()

            val taskStatus = fetchTaskStatus(taskId)

            val updatedList =
                taskInfoList.map { taskInfo ->
                    if (taskInfo.taskID == taskId) {
                        taskInfo.copy(taskStatus = taskStatus)
                    } else {
                        taskInfo
                    }
                }

            taskInfoList = updatedList

            val workerBalance = getWorkerAccountInfo()
            _dashboardUiState.value = DashboardUiState.Success(DashboardStateSuccess(taskInfoList, workerBalance))
        }
    }

    private suspend fun getWorkerAccountInfo(): Float {
        val worker = authManager.getLoggedInWorker()
        paymentRepository.getCurrentAccount(worker.idToken!!).catch {
            // TODO: There was an error updating the account
        }.collect {
            paymentRepository.updatePaymentRecord(worker.id, it)
        }
        val workerBalanceResponse = paymentRepository.getWorkerBalance(worker.idToken, worker.id).catch {
            emit(WorkerBalanceResponse(-1.0f, -1.0f))
        }.single()

        return workerBalanceResponse.workerBalance
    }

    private suspend fun fetchTaskStatus(taskId: String): TaskStatus {
        return taskRepository.getTaskStatus(taskId)
    }

    fun setProgress(i: Int) {
        _progress.value = i
    }

    fun navigatePayment() {
        viewModelScope.launch {
            val workerId = authManager.getLoggedInWorker().id
            val status = paymentRepository.getPaymentRecordStatus(workerId)

            Log.d("NAVIGATION_STATUS", status.status)
            when (status.getNavigationDestination()) {
                PaymentFlowNavigation.DASHBOARD -> _navigationFlow.emit(DashboardNavigation.PAYMENT_DASHBOARD)
                PaymentFlowNavigation.FAILURE -> _navigationFlow.emit(DashboardNavigation.PAYMENT_FAILURE)
                PaymentFlowNavigation.REGISTRATION -> _navigationFlow.emit(DashboardNavigation.PAYMENT_REGISTRATION)
                PaymentFlowNavigation.VERIFICATION -> _navigationFlow.emit(DashboardNavigation.PAYMENT_VERIFICATION)
                else -> {}
            }
        }
    }

}
