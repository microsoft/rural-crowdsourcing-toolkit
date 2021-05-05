package com.microsoft.research.karya.ui.splashScreen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class SplashViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _splashDestination: MutableStateFlow<SplashDestination> = MutableStateFlow(SplashDestination.Splash)
  val splashDestination = _splashDestination.asStateFlow()

  fun navigate() {
    viewModelScope.launch {
      val workers = getAllWorkers().size

      when (workers) {
        0 -> _splashDestination.value = SplashDestination.AccessCode
        // TODO: check if authentication is complete or not.
        1 -> _splashDestination.value = SplashDestination.Dashboard
        else -> _splashDestination.value = SplashDestination.UserSelection
      }
    }
  }

  private suspend fun getAllWorkers(): List<WorkerRecord> {
    return workerRepository.getAllWorkers()
  }

  private suspend fun getLoggedInWorker(): WorkerRecord {
    return authManager.fetchLoggedInWorker()
  }

  private suspend fun isWorkerRegistrationComplete(): Boolean {
    return authManager.isWorkerRegistered()
  }
}
