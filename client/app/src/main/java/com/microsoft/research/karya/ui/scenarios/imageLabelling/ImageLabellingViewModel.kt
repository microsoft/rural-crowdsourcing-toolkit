package com.microsoft.research.karya.ui.scenarios.imageLabelling

import android.service.autofill.Validators.not
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
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
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class ImageLabellingViewModel
@Inject
constructor(
  assignmentRepository: AssignmentRepository,
  taskRepository: TaskRepository,
  microTaskRepository: MicroTaskRepository,
  @FilesDir fileDirPath: String,
  authManager: AuthManager,
  dataStore: DataStore<Preferences>
) : BaseMTRendererViewModel(
  assignmentRepository,
  taskRepository,
  microTaskRepository,
  fileDirPath,
  authManager,
  dataStore
) {

  // Image to be shown
  private val _imageFilePath: MutableStateFlow<String> = MutableStateFlow("")
  val imageFilePath = _imageFilePath.asStateFlow()

  // State of the labels
  private val _labelState: MutableStateFlow<MutableMap<String, Boolean>> = MutableStateFlow(mutableMapOf())
  val labelState = _labelState.asStateFlow()

  /** Complete microtask and move to next */
  fun completeLabelling() {
    // Add all labels to the outputData
    val labels = JsonObject()
    labelState.value.forEach { (label, state) -> labels.addProperty(label, state) }
    outputData.add("labels", labels)
    _labelState.value = mutableMapOf()
    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  /** Setup image transcription microtask */
  override fun setupMicrotask() {
    // Get and set the image file
    _imageFilePath.value =
      try {
        val imageFileName = currentMicroTask.input.asJsonObject.getAsJsonObject("files").get("image").asString
        microtaskInputContainer.getMicrotaskInputFilePath(currentMicroTask.id, imageFileName)
      } catch (e: Exception) {
        ""
      }

    // Set up the labels
    val labels =
      try {
        task.params.asJsonObject.get("labels").asJsonArray.map { it.asString }
      } catch (e: Exception) {
        arrayListOf()
      }
    labels.forEach { _labelState.value[it] = false }
  }

  /** Flip the state of a label */
  fun flipState(label: String) {
    val newState: MutableMap<String, Boolean> = mutableMapOf()
    _labelState.value.forEach { (s, b) -> newState[s] = b }
    if (newState.containsKey(label)) {
      newState[label] = !newState[label]!!
    } else {
      newState[label] = true
    }
    _labelState.value = newState
  }
}
