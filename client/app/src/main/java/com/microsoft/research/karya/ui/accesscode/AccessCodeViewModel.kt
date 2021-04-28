package com.microsoft.research.karya.ui.accesscode

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

@HiltViewModel
class AccessCodeViewModel @Inject constructor(private val workerRepository: WorkerRepository) : ViewModel() {

  // Stores the current worker access code during the access code flow
  var currentWorkerAccessCode: String = ""

  fun checkAccessCode(accessCode: String): Flow<Result> {
    return workerRepository.verifyAccessCode(accessCode).map { response -> response.appLanguage }.mapToResult()
  }

  fun createWorker(accessCode: String, language: Int) {
    val emptyWorker = WorkerRecord.createEmptyWorker()
    val worker = emptyWorker.copy(accessCode = accessCode, appLanguage = language)

    currentWorkerAccessCode = accessCode
    viewModelScope.launch { workerRepository.upsertWorker(worker) }
  }

  fun getWorkerByAccessCode(accessCode: String): Flow<WorkerRecord> {
    return flow {
      // We should never reach the error case
      val worker = workerRepository.getWorkerByAccessCode(accessCode) ?: error("User not found")

      emit(worker)
    }
  }
}
