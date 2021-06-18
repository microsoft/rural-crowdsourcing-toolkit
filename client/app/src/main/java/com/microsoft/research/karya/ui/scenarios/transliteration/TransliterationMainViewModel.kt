package com.microsoft.research.karya.ui.scenarios.transliteration

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
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.properties.Delegates

@HiltViewModel
class TransliterationMainViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
) : BaseMTRendererViewModel(assignmentRepository, taskRepository, microTaskRepository, fileDirPath, authManager) {

  private val _wordTvText: MutableStateFlow<String> = MutableStateFlow("")
  val wordTvText = _wordTvText.asStateFlow()

  private val _transliterations: MutableStateFlow<ArrayList<String>> = MutableStateFlow(ArrayList())
  val transliterations = _transliterations.asStateFlow()

  var limit by Delegates.notNull<Int>()

  override fun setupMicrotask() {
    _wordTvText.value = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("word").asString
    limit = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("limit").asInt
  }

  /** Handle next button click */
  fun handleNextClick() {

    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    val array = JsonArray()
    for (word in _transliterations.value) { array.add(word) }
    outputData.add("transliterations", array)

    // Clear up the transliterations list
    _transliterations.value.clear()

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  fun addWord(word: String) {
    if (word.isNotEmpty()) {
      val new_arr = ArrayList(_transliterations.value)
      new_arr.add(0, word)
      _transliterations.value = new_arr
    }
  }

  fun removeWord(word: String) {
    val new_arr = ArrayList(_transliterations.value)
    new_arr.remove(word)
    _transliterations.value = new_arr
  }

}
