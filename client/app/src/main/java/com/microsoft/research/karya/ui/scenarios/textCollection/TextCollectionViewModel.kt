package com.microsoft.research.karya.ui.scenarios.textCollection

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.enums.LanguageType
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.properties.Delegates

@HiltViewModel
class TextCollectionViewModel
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

  enum class SentenceVerificationStatus {
    NEW
  }

  private val _wordTvText: MutableStateFlow<String> = MutableStateFlow("")
  val wordTvText = _wordTvText.asStateFlow()
  var sourceWord: String = ""

  val _outputVariants: MutableList<Pair<String, SentenceVerificationStatus>> = mutableListOf()

  val _inputVariants: MutableList<Pair<String, SentenceVerificationStatus>> = mutableListOf()

  private val _refreshUserInputList: MutableSharedFlow<Boolean> = MutableSharedFlow(1)
  val refreshUserInputList = _refreshUserInputList.asSharedFlow()

  var limit by Delegates.notNull<Int>()

  override fun setupMicrotask() {
    // TODO: Move to Gson
    sourceWord = "HELLO"
//    sourceWord = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("prompt").asString
    _wordTvText.value = sourceWord

    limit = 3
//    limit = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("limit").asInt
  }

  /** Handle next button click */
  fun handleNextClick() {

    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    val variants = JsonObject()

    for ((sentence, sentenceStatus) in _outputVariants) {
      val wordObject = JsonObject()
      wordObject.addProperty("status", sentenceStatus.name)
      variants.add(sentence, wordObject)
    }

    outputData.add("sentences", variants)

    // Clear up the transliterations list
    _inputVariants.clear()
    _outputVariants.clear()

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  fun addWord(word: String) {
    _inputVariants.add(Pair(word, SentenceVerificationStatus.NEW))
    _refreshUserInputList.tryEmit(true)
  }

  fun removeWord(word: String) {
    val list = _inputVariants
    for (item in list) {
      if (item.first == word) {
        list.remove(item)
      }
    }
    _refreshUserInputList.tryEmit(true)
  }


  private fun copyMutableList(
    list: MutableList<Pair<String, SentenceVerificationStatus>>)
  : MutableList<Pair<String, SentenceVerificationStatus>> {
    val temp =  mutableListOf<Pair<String, SentenceVerificationStatus>>()
    for (input in list) { temp.add(input) }
    return temp
  }

}
