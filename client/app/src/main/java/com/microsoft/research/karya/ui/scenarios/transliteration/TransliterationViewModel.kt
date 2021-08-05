package com.microsoft.research.karya.ui.scenarios.transliteration

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ng.LanguageType
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import com.microsoft.research.karya.ui.scenarios.transliteration.TransliterationViewModel.WordOrigin.HUMAN
import com.microsoft.research.karya.ui.scenarios.transliteration.TransliterationViewModel.WordVerificationStatus.NEW
import com.microsoft.research.karya.ui.scenarios.transliteration.TransliterationViewModel.WordVerificationStatus.UNKNOWN
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import kotlin.properties.Delegates

@HiltViewModel
class TransliterationViewModel
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
  var sourceLanguage: LanguageType = LanguageType.HI
  var sourceWord: String = ""
  var mlFeedback: Boolean = false
  var variantLimitTask: Int = 0

  private val _outputVariants: MutableLiveData<MutableMap<String, WordDetail>> =
    MutableLiveData(mutableMapOf())
  val outputVariants: LiveData<MutableMap<String, WordDetail>> = _outputVariants

  private val _inputVariants: MutableLiveData<MutableMap<String, WordDetail>> =
    MutableLiveData(mutableMapOf())
  val inputVariants: LiveData<MutableMap<String, WordDetail>> = _inputVariants

  var limit by Delegates.notNull<Int>()

  override fun setupViewModel(taskId: String, incompleteMta: Int, completedMta: Int) {
    super.setupViewModel(taskId, incompleteMta, completedMta)
    // TODO: Move to Gson
    allowValidation = try {
      task.params.asJsonObject.get("allowValidation").asBoolean
    } catch (e: Exception) {
      false
    }
    mlFeedback = try {
      task.params.asJsonObject.get("mlFeedback").asBoolean
    } catch (e: Exception) {
      false
    }
    variantLimitTask = try {
      task.params.asJsonObject.get("limit").asInt
    } catch (e: Exception) {
      2
    }
  }

  override fun setupMicrotask() {
    // TODO: Move to Gson
    sourceLanguage = LanguageType.valueOf(task.params.asJsonObject.get("language").asString);
    sourceWord = currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("word").asString
    _wordTvText.value = sourceWord

    limit = try {
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("limit").asInt
    } catch (e: Exception) {
      variantLimitTask
    }

    val variantsJsonObject = try {
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("variants").asJsonObject
    } catch (e: Exception) {
      JsonObject()
    }
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
      wordObject.addProperty("status", wordDetail.verificationStatus.name)
      variants.add(word, wordObject)
    }

    for ((word, wordDetail) in _inputVariants.value!!) {
      val wordObject = JsonObject()
      wordObject.addProperty("origin", wordDetail.origin.name)
      if (allowValidation)
        wordObject.addProperty("status", WordVerificationStatus.VALID.name)
      else
        wordObject.addProperty("status", UNKNOWN.name)
      variants.add(word, wordObject)
    }

    outputData.add("variants", variants)

    // Clear up the transliterations list
    _inputVariants.value!!.clear()
    _outputVariants.value!!.clear()

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  fun addWord(word: String) {
    val temp = copyMutableList(_inputVariants.value!!)
    temp[word] = WordDetail(HUMAN, NEW)
    _inputVariants.value = temp
  }

  fun removeWord(word: String) {
    val temp = copyMutableList(_inputVariants.value!!)
    temp.remove(word)
    _inputVariants.value = temp
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
