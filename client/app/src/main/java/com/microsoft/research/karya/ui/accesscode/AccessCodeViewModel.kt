package com.microsoft.research.karya.ui.accesscode

import androidx.lifecycle.ViewModel
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@HiltViewModel
class AccessCodeViewModel @Inject constructor(private val workerRepository: WorkerRepository) :
    ViewModel() {

  fun checkAccessCode(accessCode: String): Flow<Result> {
    return workerRepository
        .getWorkerUsingAccessCode(accessCode)
        .map { response -> response.appLanguage }
        .mapToResult()
  }
}
