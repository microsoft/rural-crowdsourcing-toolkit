package com.microsoft.research.karya.data.manager

import android.util.Log
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.Result
import java.io.File
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.single
import kotlinx.coroutines.withContext

class ResourceManager
@Inject
constructor(
  private val languageRepository: LanguageRepository,
  private val karyaFileRepository: KaryaFileRepository,
  private val filesDirPath: String,
) {

  fun areLanguageResourcesAvailable(languageId: Int): Boolean {
    val languageResFolder = File(getAudioFolderPath(languageId.toString()))

    return languageResFolder.exists() &&
      languageResFolder.isDirectory &&
      languageResFolder.listFiles()?.isNotEmpty() ?: false
  }

  fun downloadLanguageResources(accessCode: String, languageId: Int) = flow {
    emit(Result.Loading)

    val languages =
      languageRepository
        .getLanguages(accessCode)
        .flowOn(Dispatchers.IO)
        .catch {
          Log.d("ResourceManager", "Error downloading languageRecords")
          emit(Result.Error(it))
          return@catch
        }
        .single()

    val languageRecord = languages.find { it.id == languageId }

    // lrv_file_id is null for English atm
    val karyaFileId = languageRecord?.lrv_file_id ?: "2"

    val responseBody =
      karyaFileRepository
        .getKaryaFile(accessCode, "", karyaFileId)
        .flowOn(Dispatchers.IO)
        .catch {
          Log.d("ResourceManager", "Error downloading KaryaFile")
          emit(Result.Error(it))
          return@catch
        }
        .single()

    // TODO: Use new apis
    withContext(Dispatchers.IO) {
      FileUtils.downloadFileToLocalPath(responseBody, getTarballPath(languageId.toString()))
      FileUtils.extractTarBallIntoDirectory(
        getTarballPath(languageId.toString()),
        getAudioFolderPath(languageId.toString())
      )
    }

    emit(Result.Success(Unit))
  }

  private fun getTarballPath(languageId: String): String {
    return "$filesDirPath/$RELATIVE_TARBALL_PATH/$languageId.tar"
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
