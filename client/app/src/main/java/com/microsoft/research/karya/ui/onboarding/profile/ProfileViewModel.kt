package com.microsoft.research.karya.ui.onboarding.profile

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.exceptions.UnknownException
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.Destination
import com.microsoft.research.karya.utils.extensions.rotateRight
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val workerRepository: WorkerRepository,
  @FilesDir private val filesDirPath: String,
) : ViewModel() {

  private val _profileUiState: MutableStateFlow<ProfileUiState> = MutableStateFlow(ProfileUiState.Initial)
  val profileUiState = _profileUiState.asStateFlow()

  private val _profileEffects: MutableSharedFlow<ProfileEffects> = MutableSharedFlow()
  val profileEffects = _profileEffects.asSharedFlow()

  fun saveProfileData(name: String) {
    viewModelScope.launch {
      _profileUiState.value = ProfileUiState.Loading

      val profileDir = File(filesDirPath, "profile")
      val accessCode = authManager.fetchLoggedInWorkerAccessCode()
      val imageFile = File(profileDir, accessCode)
      val path = if (imageFile.exists()) imageFile.path else null

      val worker = authManager.fetchLoggedInWorker()

      try {
        workerRepository.upsertWorker(worker.copy(profilePicturePath = path, fullName = name))
        _profileUiState.value = ProfileUiState.Success(path)
        // TODO: Check which navigation scenario to launch here
        handleNavigation()
      } catch (throwable: Throwable) {
        _profileUiState.value = ProfileUiState.Error(UnknownException("Error saving data"))
      }
    }
  }

  fun saveProfileImage(bitmap: Bitmap) {
    viewModelScope.launch {
      _profileUiState.value = ProfileUiState.Loading

      val profileDir = File(filesDirPath, "profile")
      profileDir.mkdirs()

      val accessCode = authManager.fetchLoggedInWorkerAccessCode()
      val imageFile = File(profileDir, accessCode)

      val result = writeBitmap(bitmap, imageFile)

      if (result) {
        val worker = authManager.fetchLoggedInWorker()
        updateWorker(worker.copy(profilePicturePath = imageFile.path))

        _profileUiState.value = ProfileUiState.Success(imageFile.path)
      } else {
        _profileUiState.value = ProfileUiState.Error(UnknownException("Could not save image"))
      }
    }
  }

  fun rotateProfileImage() {
    viewModelScope.launch(Dispatchers.IO) {
      _profileUiState.value = ProfileUiState.Loading

      val profileDir = File(filesDirPath, "profile")
      profileDir.mkdirs()

      val accessCode = authManager.fetchLoggedInWorkerAccessCode()
      val imageFile = File(profileDir, accessCode)

      if (!imageFile.exists()) {
        _profileUiState.value = ProfileUiState.Error(UnknownException("Image does not exist"))
        return@launch
      }

      var bitmap = BitmapFactory.decodeFile(imageFile.path)
      imageFile.delete()

      bitmap = bitmap.rotateRight()
      imageFile.createNewFile()
      val result = writeBitmap(bitmap, imageFile)

      if (result) {
        _profileUiState.value = ProfileUiState.Success(imageFile.path)
      } else {
        _profileUiState.value = ProfileUiState.Error(UnknownException("Could not save image"))
      }
    }
  }

  private suspend fun handleNavigation() {
    val worker = authManager.fetchLoggedInWorker()

    val destination =
      when {
        worker.yob.isNullOrEmpty() -> Destination.MandatoryDataFlow
        else -> Destination.Dashboard
      }

    _profileEffects.emit(ProfileEffects.Navigate(destination))
  }

  private suspend fun writeBitmap(bitmap: Bitmap, file: File): Boolean =
    withContext(Dispatchers.IO) {
      return@withContext bitmap.compress(Bitmap.CompressFormat.PNG, 100, file.outputStream())
    }

  private suspend fun updateWorker(worker: WorkerRecord) =
    withContext(Dispatchers.IO) { workerRepository.upsertWorker(worker) }
}
