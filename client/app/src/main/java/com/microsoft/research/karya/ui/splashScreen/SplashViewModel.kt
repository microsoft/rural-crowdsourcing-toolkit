package com.microsoft.research.karya.ui.splashScreen

import androidx.lifecycle.ViewModel
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(private val workerRepository: WorkerRepository) : ViewModel() {

    suspend fun getLoggedInUsers(): List<WorkerRecord> {
        return workerRepository.getAllWorkers()
    }
}
