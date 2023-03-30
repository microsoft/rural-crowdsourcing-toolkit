package com.microsoft.research.karya.ui.scenarios.textToTextTranslation

import android.util.Log
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
class TextToTextTranslationViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
) : BaseMTRendererViewModel(assignmentRepository, taskRepository, microTaskRepository, fileDirPath, authManager) {

  private val _bowArray: MutableStateFlow<Array<String>> = MutableStateFlow(arrayOf())
  val bowArray = _bowArray.asStateFlow()

  private val _support: MutableStateFlow<String> = MutableStateFlow("")
  val support = _support.asStateFlow()

  private val _targetText: MutableStateFlow<String> = MutableStateFlow("")
  val targetText = _targetText.asStateFlow()

  private val _inputUpdates: MutableStateFlow<Pair<String, Array<String>>> = MutableStateFlow(Pair("", arrayOf()))
  val inputUpdates = _inputUpdates.asStateFlow()

  private var startingTime by Delegates.notNull<Long>()

  override fun setupMicrotask() {
    // TODO: Move to Gson
    val sourceSentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("sentence").asString
    _support.value = task.params.asJsonObject.get("mode").asString

    var bowArray: Array<String> = arrayOf()
    when (_support.value) {
      "bow" -> {
        val bowSentence = currentMicroTask.input.asJsonObject.getAsJsonObject("data").asJsonObject.get("bow").asString
        bowArray = bowSentence.split(" ").toTypedArray()
      }
    }

    _inputUpdates.value = Pair(sourceSentence, bowArray)

    // Start measuring time
    startingTime = System.currentTimeMillis()
  }

  /** Handle next button click */
  fun handleNextClick() {

    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    message.addProperty("time_taken", System.currentTimeMillis()-startingTime)
    log(message)

    outputData.addProperty("target", _targetText.value)

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

    fun handleSkipClick() {
        viewModelScope.launch {
            skipAndSaveCurrentMicrotask()
            moveToNextMicrotask()
        }
    }

  /** Set score for translation*/
  fun setTarget(text: String) {
    _targetText.value = text
  }

  fun setSupport(support: String) {
    _support.value = support
  }

  fun logger(message: String) {
    log(message)
    Log.i("message", message)
  }
}
