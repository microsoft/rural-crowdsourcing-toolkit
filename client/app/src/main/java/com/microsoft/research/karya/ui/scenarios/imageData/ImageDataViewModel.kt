package com.microsoft.research.karya.ui.scenarios.imageData

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
class ImageDataViewModel
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
  private val _imageState: MutableStateFlow<MutableList<Boolean>> = MutableStateFlow(mutableListOf())
  val imageState = _imageState.asStateFlow()

  /**
   * Setup image data collection microtask
   */
  override fun setupMicrotask() {
    // Get number of images to be captured
    val numImages = try {
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("count").asInt
    } catch (e: Exception) {
      0
    }

    // Initial image state
    val initialImageState: MutableList<Boolean> = mutableListOf()
    for (i in 0..numImages) {
      initialImageState.add(false)
    }
    _imageState.value = initialImageState
  }

  /**
   * Update image state
   */
  fun updateImageState(index: Int, value: Boolean) {
    val newImageState: MutableList<Boolean> = mutableListOf()
    _imageState.value.forEachIndexed { i, b ->
      newImageState.add(b)
    }
    newImageState[index] = value
    _imageState.value = newImageState
  }

  /**
   * Get output file params for image at an index
   */
  private fun outputFileParams(index: Int): Pair<String, String> {
    return Pair("p$index", "jpg")
  }

  /**
   * Output file name for a given index
   */
  fun outputFilePath(index: Int): String {
    val assignmentId = microtaskAssignmentIDs[currentAssignmentIndex]
    return assignmentOutputContainer.getAssignmentOutputFilePath(assignmentId, outputFileParams(index))
  }

  /**
   * Complete microtask. Add all output files.
   */
  fun completeDataCollection() {
    _imageState.value.forEachIndexed { index, present ->
      if (!present) {
        // Something wrong. Image file is not present
      }
      addOutputFile("p$index", outputFileParams(index))
    }

    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }
}
