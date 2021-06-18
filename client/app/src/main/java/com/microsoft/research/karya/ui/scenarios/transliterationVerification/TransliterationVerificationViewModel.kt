package com.microsoft.research.karya.ui.scenarios.transliterationVerification

import androidx.lifecycle.viewModelScope
import com.google.gson.JsonArray
import com.google.gson.JsonObject
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
class TransliterationVerificationViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
) : BaseMTRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager
) {

  private val _wordTvText: MutableStateFlow<String> = MutableStateFlow("")
  val wordTvText = _wordTvText.asStateFlow()

  private val _transliterations: MutableStateFlow<ArrayList<String>> = MutableStateFlow(ArrayList())
  val transliterations = _transliterations.asStateFlow()

  private val _error: MutableStateFlow<String> = MutableStateFlow("")
  val error = _error.asStateFlow()

  private lateinit var userValidations: IntArray

  enum class Response {
    CORRECT, INCORRECT, NOT_ATTEMPTED
  }

  override fun setupMicrotask() {
    _wordTvText.value =
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("word").asString

    //TODO: Replace with real data from API response
    val temp = ArrayList<String>()
    val strs = arrayOf("This", "is", "a", "stream", "of", "random", "string", "testing")
    for (i in 1..5) { temp.add(strs.random()) }
    _transliterations.value = temp

    userValidations = IntArray(_transliterations.value.size) { Response.NOT_ATTEMPTED.ordinal }

  }

  /** Handle next button click */
  fun handleNextClick() {

    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    val array = JsonArray()
    for (res in userValidations) {
      when (res) {
        Response.CORRECT.ordinal -> array.add(true)
        Response.INCORRECT.ordinal -> array.add(false)
        Response.NOT_ATTEMPTED.ordinal -> {
          _error.value = "Please verify all the words"
          return
        }
      }
    }
    outputData.add("validations", array)

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  fun markCorrect(index: Int) { userValidations[index] = Response.CORRECT.ordinal }

  fun markIncorrect(index: Int) { userValidations[index] = Response.INCORRECT.ordinal }

  fun resetError() {
    _error.value = ""
  }

}
