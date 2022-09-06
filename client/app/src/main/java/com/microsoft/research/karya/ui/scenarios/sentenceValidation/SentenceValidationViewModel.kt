package com.microsoft.research.karya.ui.scenarios.sentenceValidation

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.lifecycle.viewModelScope
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
class SentenceValidationViewModel
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
)
{
  // UI elements controlled by the view model

  // Sentence
  private val _sentence: MutableStateFlow<String> = MutableStateFlow("")
  val sentence = _sentence.asStateFlow()

  /**
   * Setup sentence validation microtask
   */
  override fun setupMicrotask() {
    val inputData = currentMicroTask.input.asJsonObject.getAsJsonObject("data")
    _sentence.value = inputData.get("sentence").asString
  }

  /**
   * Submit response
   */
  fun submitResponse(grammar: Boolean, spelling: Boolean) {
    outputData.addProperty("grammar", grammar)
    outputData.addProperty("spelling", spelling)

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }
}
