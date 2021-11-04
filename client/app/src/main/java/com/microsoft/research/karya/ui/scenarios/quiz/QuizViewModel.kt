package com.microsoft.research.karya.ui.scenarios.quiz

import androidx.annotation.IdRes
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
): BaseMTRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager
) {

  // UI Elements controlled by the view model

  // Question
  private val _question: MutableStateFlow<Question> =
    MutableStateFlow(Question(QuestionType.invalid))
  val question = _question.asStateFlow()

  // Id button map
  private val buttonTextMap: MutableMap<Int, String> = mutableMapOf()

  // Text response
  private val _textResponse: MutableStateFlow<String> = MutableStateFlow("")

  // MCQ response
  private val _mcqResponse: MutableStateFlow<Int> = MutableStateFlow(0)
  val mcqResponse = _mcqResponse.asStateFlow()

  /**
   * Setup quiz microtask
   */
  override fun setupMicrotask() {
    // Parse question from microtask input
    val inputData = currentMicroTask.input.asJsonObject.getAsJsonObject("data")
    _question.value = Gson().fromJson(inputData, Question::class.java)
  }

  /**
   * Clear the button text map
   */
  fun clearButtonTextMap() {
    buttonTextMap.clear()
  }

  /**
   * Add entry to button map
   */
  fun addButtonTextMap(@IdRes id: Int, value: String) {
    buttonTextMap[id] = value
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
  fun updateMCQResponse(@IdRes id: Int) {
    _mcqResponse.value = id
  }

  /**
   * Submit the response and move to next task
   */
  fun submitResponse() {
    val key = _question.value.key
    val res = when (_question.value.type) {
      QuestionType.text -> _textResponse.value
      QuestionType.mcq -> buttonTextMap[_mcqResponse.value].toString()
      else -> "invalid"
    }
    outputData.addProperty(key, res)

    // Clear out response
    _textResponse.value = ""
    _mcqResponse.value = 0

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }
}
