package com.microsoft.research.karya.ui.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel
@Inject
constructor(
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
  private val authManager: AuthManager,
) : ViewModel() {

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
  fun getAllTasks(): Flow<Result> {
    return taskRepository.getAllTasksFlow().mapToResult()
  }
}
