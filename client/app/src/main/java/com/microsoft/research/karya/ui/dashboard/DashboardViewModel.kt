package com.microsoft.research.karya.ui.dashboard

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.utils.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel @Inject constructor(private val microTaskRepository: MicroTaskRepository) : ViewModel() {

  fun syncTasks(context: Context, appLanguage: Int) {
    viewModelScope.launch {
      microTaskRepository.getAssignments(WorkerInformation.creation_code!!, "", "speech-data", "")
    }
  }

  /**
   * Returns a hot flow connected to the DB
   * @return [Flow] of list of [TaskRecord] wrapper in a [Result]
   */
  fun getAllTasks(): Flow<Result> {
    return microTaskRepository.getTasks().mapToResult()
  }
}
