package com.microsoft.research.karya.ui.scenarios.signVideoFeedback

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseFeedbackRendererViewModel
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

@HiltViewModel
class SignVideoFeedbackViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
) : BaseFeedbackRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager
) {

  private val _remarks: MutableStateFlow<String> = MutableStateFlow("")
  val remarks = _remarks.asStateFlow()

  private val _score: MutableStateFlow<Int> = MutableStateFlow(0)
  val score = _score.asStateFlow()

  private val _sentenceTvText: MutableStateFlow<String> = MutableStateFlow("")
  val sentenceTvText = _sentenceTvText.asStateFlow()

  private val _recordingFile: MutableStateFlow<String> = MutableStateFlow("")
  val recordingFile = _recordingFile.asStateFlow()

  private val _videoPlayerVisibility: MutableStateFlow<Boolean> = MutableStateFlow(false)
  val videoPlayerVisibility = _videoPlayerVisibility.asStateFlow()


  /** Handle next button click */
  fun handleNextClick() {
    _videoPlayerVisibility.value = false
    viewModelScope.launch {
      moveToNextMicrotask()
    }
  }

  /** Handle back button click */
  fun handleBackClick() {
    moveToPreviousMicrotask()
  }

  fun onBackPressed() {
    navigateBack()
  }


  override fun setupMicrotask() {
    // Set the sentence
    val sentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").toString()
    _sentenceTvText.value = sentence

    // Set the video
    try {
      val recordingFileName =
        currentAssignment.output.asJsonObject.getAsJsonObject("files").get("recording").asString
      val recordFilePath = assignmentOutputContainer.getAssignmentOutputFilePath(currentAssignment.id, Pair("", "mp4"))
      if (File(recordFilePath).exists()) {
        _recordingFile.value = recordFilePath
      }
      _videoPlayerVisibility.value = true
    } catch (e: Exception) {
      // Recording file does not exist. Do nothing
    }

    // Set report
    try {
      val report = currentAssignment.report.asJsonObject
      val score = report.get("score").asInt
      val remarks = report.get("remarks").asString
      _score.value = score
      _remarks.value = remarks
    } catch(e: Exception) {
      // Report does not exist
      _score.value = 0
      _remarks.value = ""
    }
  }
}
