@file:Suppress("NAME_SHADOWING")

package com.microsoft.research.karya.ui.onboarding.login.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.ui.Destination
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
) : ViewModel() {

  private val _profileUiState: MutableStateFlow<ProfileUiState> =
    MutableStateFlow(ProfileUiState.Initial(ProfileData(null, null, null)))
  val profileUiState = _profileUiState.asStateFlow()

  private val _profileEffects: MutableSharedFlow<ProfileEffects> = MutableSharedFlow()
  val profileEffects = _profileEffects.asSharedFlow()

  var profileData: ProfileData = ProfileData(null, null, null)

  fun getWorkerProfile() {
    _profileUiState.value = ProfileUiState.Loading
    viewModelScope.launch {
      val worker = authManager.getLoggedInWorker()
      // Check if profile is null
      if (worker.profile?.isJsonNull != false) {
        _profileUiState.value = ProfileUiState.Initial(ProfileData(null, null, null))
      } else {
        val name = worker.profile!!.asJsonObject.get("name").asString
        val genderString = worker.profile!!.asJsonObject.get("gender").asString
        val gender = if (genderString == "MALE") Gender.MALE else Gender.FEMALE
        val yob = worker.profile!!.asJsonObject.get("yob").asString
        _profileUiState.value = ProfileUiState.Initial(
          ProfileData(
            name,
            gender,
            yob
          )
        )
      }
    }
  }

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
        .onEach { workerResponse ->
          workerRepository.upsertWorker(worker.copy(profile=workerResponse.profile))
          _profileUiState.value = ProfileUiState.Success
          handleNavigation()
        }
        .catch { throwable ->
          _profileUiState.value = ProfileUiState.Error(throwable)
        }
        .collect()
    }
  }

  private suspend fun handleNavigation() {
    val destination = Destination.HomeScreen
    _profileEffects.emit(ProfileEffects.Navigate(destination))
  }
}
