package com.microsoft.research.karya.ui.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel
@Inject
constructor(
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
) : ViewModel() {

  private val idToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg0NDQyNDkzMDEzMjA0MyIsImlhdCI6MTYxOTY5MTk0OCwiZXhwIjoxNjI0ODc1OTQ4LCJhdWQiOiJrYXJ5YS1ib3gifQ.jxNNDkkjP9pI0cdBmcXMnu1-l2QkDb2dfcOs0S9TWjw"

  fun syncTasks(appLanguage: Int) {
    viewModelScope.launch {
      // assignmentRepository.getAssignments(WorkerInformation.creation_code!!, "", "speech-data",
      // "")
    }
  }

  fun fetchNewTasks() {
    Log.d("dashboard", "fetchNewTasks")
    assignmentRepository
      .getAssignments(idToken, "new", "")
      .catch { Log.d("dashboard", it.message!!) }
      .launchIn(viewModelScope)
  }

  fun fetchVerifiedTasks(from: String = "") {
    assignmentRepository.getAssignments(idToken, "verified", from)
  }

  /**
   * Returns a hot flow connected to the DB
   * @return [Flow] of list of [TaskRecord] wrapper in a [Result]
   */
  fun getAllTasks(): Flow<Result> {
    return taskRepository.getAllTasksFlow().mapToResult()
  }
}
