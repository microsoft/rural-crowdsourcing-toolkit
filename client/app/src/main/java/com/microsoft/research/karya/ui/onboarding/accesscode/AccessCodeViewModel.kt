package com.microsoft.research.karya.ui.onboarding.accesscode

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

@HiltViewModel
class AccessCodeViewModel
@Inject
constructor(private val workerRepository: WorkerRepository, private val authManager: AuthManager) : ViewModel() {

  // Stores the current worker access code during the access code flow
  // TODO: Use a savedStateHandle here
  var workerAccessCode: String = ""
  var workerLanguage: Int = -1

  fun checkAccessCode(accessCode: String): Flow<Result> {
    return workerRepository
      .verifyAccessCode(accessCode)
      .onEach { worker ->
        createWorker(accessCode, worker)
        authManager.updateLoggedInWorker(accessCode)
      }
      .mapToResult()
  }

  fun createWorker(accessCode: String, workerRecord: WorkerRecord) {
    val dbWorker = workerRecord.copy(accessCode = accessCode)

    workerAccessCode = accessCode
    workerLanguage = workerRecord.appLanguage
    viewModelScope.launch { workerRepository.upsertWorker(dbWorker) }
  }
}
