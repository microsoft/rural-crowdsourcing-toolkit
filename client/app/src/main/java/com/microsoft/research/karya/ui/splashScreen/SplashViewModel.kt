package com.microsoft.research.karya.ui.splashScreen

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.utils.DateUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class SplashViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
  private val assignmentRepository: AssignmentRepository
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
    var worker = getLoggedInWorker()
    // Refresh the worker
    workerRepository.getWorkerUsingIdToken(worker.idToken ?: "")
      .catch {
          e -> Log.e("CANNOT GET WORKER", e.message ?: "")
      }
      .collect { updatedWorker ->
        val newWorker = worker.copy(params = updatedWorker.params)
        workerRepository.upsertWorker(newWorker)
      }

    // Determine if worker is expired
    val tagsObject = worker.params
    if (tagsObject != null) {
      val tags = tagsObject.asJsonObject.get("tags").asJsonArray.map { it.asString }
      if (tags.contains("_DISABLED_")) {
        // If yes marked expired
        val incompleteAssignments = assignmentRepository.getIncompleteAssignments()
        incompleteAssignments.forEach { assignments ->
          assignmentRepository.markExpire(assignments.id, DateUtils.getCurrentDate())
        }
      }
    }
    _splashEffects.emit(SplashEffects.UpdateLanguage(worker.language))

    // TODO: @Anurag should the below line be JsonNull?
    val workerProfilePresent = !(worker.profile?.isJsonNull ?: false)

    val destination =
      when {
        !worker.isConsentProvided -> Destination.AccessCodeFlow
        worker.idToken.isNullOrEmpty() -> Destination.LoginFlow
        !workerProfilePresent -> Destination.ProfileFragment
        else -> Destination.HomeScreen
      }

    _splashDestination.emit(destination)
  }

  private suspend fun handleMultipleUsers() {
    _splashDestination.emit(Destination.UserSelection)
  }
}
