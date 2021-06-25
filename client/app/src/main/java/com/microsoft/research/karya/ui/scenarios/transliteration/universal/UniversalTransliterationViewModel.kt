package com.microsoft.research.karya.ui.scenarios.transliteration.universal

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.ui.scenarios.transliteration.universal.UniversalTransliterationViewModel.WordVerificationStatus.NEW
import com.microsoft.research.karya.ui.scenarios.transliteration.universal.UniversalTransliterationViewModel.WordVerificationStatus.UNKNOWN
import com.microsoft.research.karya.ui.scenarios.transliteration.universal.UniversalTransliterationViewModel.WordOrigin.HUMAN
import com.microsoft.research.karya.ui.scenarios.transliteration.universal.UniversalTransliterationViewModel.WordOrigin.MACHINE
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.properties.Delegates

@HiltViewModel
class UniversalTransliterationViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
) : BaseMTRendererViewModel(assignmentRepository, taskRepository, microTaskRepository, fileDirPath, authManager) {

  enum class WordOrigin {
    HUMAN, MACHINE
  }

  enum class WordVerificationStatus {
    UNKNOWN, NEW, VALID, INVALID
  }

  data class WordDetail(
    var origin: WordOrigin,
    var verificationStatus: WordVerificationStatus,
  )

  private val _wordTvText: MutableStateFlow<String> = MutableStateFlow("")
  val wordTvText = _wordTvText.asStateFlow()
  var allowValidation = false

  private val _outputVariants: MutableLiveData<MutableMap<String, WordDetail>> = MutableLiveData(mutableMapOf())
  val outputVariants: LiveData<MutableMap<String, WordDetail>> = _outputVariants

  var limit by Delegates.notNull<Int>()

  override fun setupMicrotask() {
    allowValidation = task.params.asJsonObject.get("allowValidation").asBoolean
    _wordTvText.value = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("word").asString
    limit = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("limit").asInt
    val variantsJsonObject = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("variants").asJsonObject
    val temp = mutableMapOf<String, WordDetail>()

    for (word in variantsJsonObject.keySet()) {
      val detail = variantsJsonObject.getAsJsonObject(word)
      val wordDetail = WordDetail(
        WordOrigin.valueOf(
          detail.get("origin").asString
        ),
        WordVerificationStatus.valueOf(
          detail.get("status").asString
        )
      )
      temp[word] = wordDetail
    }

    // TODO: Add Code to parse other data paramaters

    // TODO: Move to Gson
    // Code to add dummy api response[Word_Detail]. TODO: Remove once we take data from the API
//    val temp = mutableMapOf<String, WordDetail>()
//    val strs = arrayOf("This", "iss", "afs", "flsl", "ofsf", "alb", "bla", "bla")
//    val origin = arrayOf(HUMAN, MACHINE)
//    for (i in 1..5) { temp.put(strs.random(), WordDetail(origin.random(), UNKNOWN)) }
    _outputVariants.value = temp
  }

  /** Handle next button click */
  fun handleNextClick() {

    /** Log button press */
    val message = JsonObject()
    message.addProperty("type", "o")
    message.addProperty("button", "NEXT")
    log(message)

    val variants = JsonObject()

    for ((word, wordDetail) in _outputVariants.value!!) {
      val wordObject = JsonObject()
      wordObject.addProperty("origin", wordDetail.origin.name)
      if (wordDetail.verificationStatus == NEW) {
        wordObject.addProperty("status", UNKNOWN.name)
      } else {
        wordObject.addProperty("status", wordDetail.verificationStatus.name)
      }
      variants.add(word, wordObject)
    }

//    for ((word, wordDetail) in _outputVariants.value!!) {
//      val wordObject = JsonObject()
//      wordObject.addProperty("origin", wordDetail.origin.name)
//      if (wordDetail.verificationStatus != NEW){
//        wordObject.addProperty("status", wordDetail.verificationStatus.name)
//      }
//      variants.add(word, wordObject)
//    }

    outputData.add("variants", variants)

    // Clear up the transliterations list
    _outputVariants.value!!.clear()

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  fun addWord(word: String) {
    if (word.isNotEmpty() && !_outputVariants.value!!.containsKey(word)) {
      val temp = copyMutableList(_outputVariants.value!!)
      temp[word] = WordDetail(HUMAN, NEW)
      _outputVariants.value = temp
    }
  }

  fun removeWord(word: String) {
    val temp = copyMutableList(_outputVariants.value!!)
    temp.remove(word)
    _outputVariants.value = temp
  }

  fun modifyStatus(word: String, status: WordVerificationStatus) {
    val temp = copyMutableList(_outputVariants.value!!)
    temp[word]!!.verificationStatus = status
    _outputVariants.value = temp
  }

  private fun copyMutableList(map: MutableMap<String, WordDetail>): MutableMap<String, WordDetail> {
    val temp = mutableMapOf<String, WordDetail>()
    for (key in map.keys) {
      temp[key] = map[key]!!
    }
    return temp
  }

}
