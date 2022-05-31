package com.microsoft.research.karya.ui.scenarios.imageLabelling

import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import com.otaliastudios.cameraview.PictureResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ImageLabellingViewModel
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

  // Image to be shown
  private val _imageFilePath: MutableStateFlow<String> = MutableStateFlow("")
  val imageFilePath = _imageFilePath.asStateFlow()

  // State of the labels
  private val _labelState: MutableStateFlow<MutableMap<String, Boolean>> = MutableStateFlow(mutableMapOf())
  val labelState = _labelState.asStateFlow()

  // State of capture result
  private val _captureResult: MutableStateFlow<PictureResult?> = MutableStateFlow(null)
  val captureResult = _captureResult.asStateFlow()

  /**
   * Complete microtask and move to next
   */
  fun completeLabelling() {
    // Add all labels to the outputData
    val labels = JsonObject()
    labelState.value.forEach { (label, state) -> labels.addProperty(label, state) }
    outputData.add("labels", labels)
    // add output files
    addOutputFile("image", outputFileParams())
    _labelState.value = mutableMapOf()
    _captureResult.value = null
    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  /**
   * Setup image transcription microtask
   */
  override fun setupMicrotask() {
    // Get and set the image file
    _imageFilePath.value = try {
      val imageFileName =
        currentMicroTask.input.asJsonObject.getAsJsonObject("files").get("image").asString
      microtaskInputContainer.getMicrotaskInputFilePath(currentMicroTask.id, imageFileName)
    } catch (e: Exception) {
      ""
    }

    // Set up the labels
    val labels = try {
      task.params.asJsonObject.get("labels").asJsonArray.map { it.asString }
    } catch (e: Exception) {
      arrayListOf()
    }
    labels.forEach { _labelState.value[it] = false }

  }

  /**
   * Flip the state of a label
   */
  fun flipState(label: String) {
    val newState: MutableMap<String, Boolean> = mutableMapOf()
    _labelState.value.forEach { (s, b) ->  newState[s] = b}
    if (newState.containsKey(label)) {
      newState[label] = !newState[label]!!
    } else {
      newState[label] = true
    }
    _labelState.value = newState

  }

  fun setCaptureResult(captureResult: PictureResult) {
    _captureResult.value = captureResult
  }

  /**
   * Get output file params for image
   */
  private fun outputFileParams(): Pair<String, String> {
    val filename = microtaskAssignmentIDs[currentAssignmentIndex]
    return Pair(filename, "jpg")
  }

  /**
   * Output file name
   */
  fun outputFilePath(): String {
    val assignmentId = microtaskAssignmentIDs[currentAssignmentIndex]
    return assignmentOutputContainer.getAssignmentOutputFilePath(assignmentId, outputFileParams())
  }

}
