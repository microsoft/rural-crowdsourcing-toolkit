package com.microsoft.research.karya.data.manager

import android.util.Log
import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.Result
import java.io.File
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.singleOrNull
import kotlinx.coroutines.withContext

class ResourceManager
@Inject
constructor(
  private val languageRepository: LanguageRepository,
  private val filesDirPath: String,
) {

  fun areLanguageResourcesAvailable(language: String): Boolean {
    val languageResFolder = File(getAudioFolderPath(language))

    return languageResFolder.exists() &&
      languageResFolder.isDirectory &&
      languageResFolder.listFiles()?.isNotEmpty() ?: false
  }

  fun downloadLanguageResources(accessCode: String, language: String) = flow {
    emit(Result.Loading)

    if (areLanguageResourcesAvailable(language)) {
      emit(Result.Success(Unit))
      return@flow
    }

    // If the flow is empty we have already emitted an error result so don't do anything else
    val responseBody =
      languageRepository
        .getLanguageAssets(accessCode, language)
        .flowOn(Dispatchers.IO)
        .catch {
          Log.d("ResourceManager", "Error downloading files for language: $language")
          emit(Result.Error(it))
          return@catch
        }
        .singleOrNull()
        ?: return@flow

    kotlin
      .runCatching {
        withContext(Dispatchers.IO) {
          FileUtils.downloadFileToLocalPath(responseBody, getTarballPath(language))
          FileUtils.extractGZippedTarBallIntoDirectory(getTarballPath(language), getAudioFolderPath(language))
        }
      }
      .onSuccess { emit(Result.Success(Unit)) }
      .onFailure {
        it.printStackTrace()
        emit(Result.Error(it))
      }
  }

  private fun getTarballPath(language: String): String {
    return "$filesDirPath/$RELATIVE_TARBALL_PATH/$language.tgz"
  }

  private fun getAudioFolderPath(languageId: String): String {
    return "$filesDirPath/$RELATIVE_AUDIO_FILE_PATH/$languageId"
  }

  fun getAudioFilePath(languageId: String, fileNameWithExtension: String): String {
    return "$filesDirPath/$RELATIVE_AUDIO_FILE_PATH/$languageId/$fileNameWithExtension"
  }

  companion object {
    const val RELATIVE_TARBALL_PATH = "tar/audio"
    const val RELATIVE_AUDIO_FILE_PATH = "audio"
  }
}
