package com.microsoft.research.karya.ui.splashScreen

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.ui.Destination
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

@HiltViewModel
class SplashViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _splashDestination = MutableSharedFlow<Destination>()
  val splashDestination = _splashDestination.asSharedFlow()

  private val _splashEffects = MutableSharedFlow<SplashEffects>()
  val splashEffects = _splashEffects.asSharedFlow()

  fun navigate() {
    viewModelScope.launch {
      val workers = getAllWorkers().size

      when (workers) {
        0 -> handleNewUser()
        1 -> handleSingleUser()
        else -> handleMultipleUsers()
      }
    }
  }

  private suspend fun getAllWorkers(): List<WorkerRecord> {
    return workerRepository.getAllWorkers()
  }

  private suspend fun getLoggedInWorker(): WorkerRecord {
    return authManager.getLoggedInWorker()
  }

  private suspend fun handleNewUser() {
    _splashDestination.emit(Destination.AccessCodeFlow)
  }

  private suspend fun handleSingleUser() {
    val worker = getLoggedInWorker()
    _splashEffects.emit(SplashEffects.UpdateLanguage(worker.language))

    // TODO: @Anurag should the below line be JsonNull?
    val workerProfilePresent = worker.profile != null

    val destination =
      when {
        !worker.isConsentProvided -> Destination.AccessCodeFlow
        worker.idToken.isNullOrEmpty() -> Destination.LoginFlow
        workerProfilePresent -> Destination.ProfileFragment
        else -> Destination.HomeScreen
      }

    _splashDestination.emit(destination)
  }

  private suspend fun handleMultipleUsers() {
    _splashDestination.emit(Destination.UserSelection)
  }
}
