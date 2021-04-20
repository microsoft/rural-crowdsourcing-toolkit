package com.microsoft.research.karya.ui.accesscode

import androidx.lifecycle.ViewModel
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.mapToResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

@HiltViewModel
class AccessCodeViewModel @Inject constructor(private val workerRepository: WorkerRepository) : ViewModel() {

    val mutableStateFlow = MutableStateFlow("")
    val stateFlow = mutableStateFlow.asStateFlow()

    fun checkAccessCode(accessCode: String): Flow<Result> {
        return workerRepository.getWorkerUsingAccessCode(accessCode)
            .map { response ->
                response.languageId
            }.mapToResult()
    }
}
