package com.microsoft.research.karya.ui.scenarios.textTranslationValidation

import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlin.properties.Delegates
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class TextTranslationValidationViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
) : BaseMTRendererViewModel(assignmentRepository, taskRepository, microTaskRepository, fileDirPath, authManager) {
  private val _sourceTvText: MutableStateFlow<String> = MutableStateFlow("")
  val sourceTvText = _sourceTvText.asStateFlow()
  private val _targetTvText: MutableStateFlow<String> = MutableStateFlow("")
  val targetTvText = _targetTvText.asStateFlow()
  private val _score: MutableStateFlow<Int> = MutableStateFlow(-1)

  var limit by Delegates.notNull<Int>()

  override fun setupMicrotask() {
    // TODO: Move to Gson
    val sourceSentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("source").asString
    val targetSentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("target").asString

    _sourceTvText.value = sourceSentence
    _targetTvText.value = targetSentence
  }

  /** Handle next button click */
  fun handleNextClick() {

    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    outputData.addProperty("score", _score.value)

    _score.value = -1

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  /** Set score for translation*/
  fun setScore(score: Int) {
    _score.value = score
  }
}
