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
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

@HiltViewModel
class AccessCodeViewModel @Inject constructor(private val workerRepository: WorkerRepository) : ViewModel() {

  // Stores the current worker access code during the access code flow
  var workerAccessCode: String = ""
  var workerLanguage: Int = -1

  fun checkAccessCode(accessCode: String): Flow<Result> {
    return workerRepository.verifyAccessCode(accessCode).map { response -> response.appLanguage }.mapToResult()
  }

  fun createWorker(accessCode: String, language: Int) {
    val emptyWorker = WorkerRecord.createEmptyWorker()
    val worker = emptyWorker.copy(accessCode = accessCode, appLanguage = language)

    workerAccessCode = accessCode
    workerLanguage = language
    viewModelScope.launch { workerRepository.upsertWorker(worker) }
  }
}
