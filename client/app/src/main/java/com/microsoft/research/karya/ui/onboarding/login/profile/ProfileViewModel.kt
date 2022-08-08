@file:Suppress("NAME_SHADOWING")

package com.microsoft.research.karya.ui.onboarding.login.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.ui.Destination
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@HiltViewModel
class ProfileViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _profileUiState: MutableStateFlow<ProfileUiState> = MutableStateFlow(ProfileUiState.Initial(ProfileData(null, null, null)))
  val profileUiState = _profileUiState.asStateFlow()

  private val _profileEffects: MutableSharedFlow<ProfileEffects> = MutableSharedFlow()
  val profileEffects = _profileEffects.asSharedFlow()

  var profileData: ProfileData = ProfileData(null, null, null)

  fun handleNextClick() {
    viewModelScope.launch {
      _profileUiState.value = ProfileUiState.Loading
      // If either of the fields are empty
      if (profileData.name.isNullOrEmpty() ||
        profileData.gender == null ||
        profileData.yob.isNullOrEmpty()) {
        _profileUiState.value = ProfileUiState.Error(Throwable())
        return@launch
      }
      val worker = authManager.getLoggedInWorker()
      val profile = JsonObject()
      profile.addProperty("name", profileData.name)
      profile.addProperty("gender", profileData.gender.toString())
      profile.addProperty("yob", profileData.yob)

      // Send the profile to server
      workerRepository.updateWorkerProfile(worker.idToken!!, profile)
        .onEach { worker ->
          workerRepository.upsertWorker(worker)
          _profileUiState.value = ProfileUiState.Success
          handleNavigation()
        }
        .catch {
            throwable -> _profileUiState.value = ProfileUiState.Error(throwable)
        }
        .collect()
    }
  }

  private suspend fun handleNavigation() {
    val destination = Destination.Dashboard
    _profileEffects.emit(ProfileEffects.Navigate(destination))
  }
}
