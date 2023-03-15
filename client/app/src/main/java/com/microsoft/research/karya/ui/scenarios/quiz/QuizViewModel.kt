package com.microsoft.research.karya.ui.scenarios.quiz

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class QuizViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
  dataStore: DataStore<Preferences>
): BaseMTRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager,
  dataStore
) {

  // UI Elements controlled by the view model

  // Images
  // Pair represents the map where first element is image name and second element is image path
  private val _inputFileImages: MutableStateFlow<HashMap<String, String>> = MutableStateFlow(hashMapOf())
  val inputFileImages = _inputFileImages.asStateFlow()

  // Question
  private val _question: MutableStateFlow<Question> =
    MutableStateFlow(Question(Type.invalid))
  val question = _question.asStateFlow()

  // Text response
  private val _textResponse: MutableStateFlow<String> = MutableStateFlow("")

  // MCQ response
  private val _mcqResponse: MutableStateFlow<String> = MutableStateFlow("")

  /**
   * Setup quiz microtask
   */
  override fun setupMicrotask() {

    val inputImageNames = currentMicroTask.input.asJsonObject.getAsJsonObject("files").get("images").asJsonArray
    val imageFilePaths = hashMapOf<String, String>()
    inputImageNames.forEach {
      val filePath = microtaskInputContainer.getMicrotaskInputFilePath(currentMicroTask.id, it.asString)
      imageFilePaths[it.asString] = filePath
    }
    _inputFileImages.value = imageFilePaths

    // Parse question from microtask input
    val inputData = currentMicroTask.input.asJsonObject.getAsJsonObject("data")
    _question.value = Gson().fromJson(inputData, Question::class.java)
  }

  /**
   * Update text response
   */
  fun updateTextResponse(res: String) {
    _textResponse.value = res
  }

  /**
   * Update mcq response
   */
  fun updateMCQResponse(value: String) {
    _mcqResponse.value = value
  }

  /**
   * Submit the response and move to next task
   */
  fun submitResponse() {
    val key = _question.value.key
    val res = when (_question.value.type) {
      Type.text -> _textResponse.value
      Type.mcq -> _mcqResponse.value
      else -> "invalid"
    }
    outputData.addProperty(key, res)

    // Clear out response
    _textResponse.value = ""
    _mcqResponse.value = ""

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }
}
