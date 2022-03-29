package com.microsoft.research.karya.ui.scenarios.imageAnnotation

import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive
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
class ImageAnnotationViewModel
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

  // Labeled Box coordinates
  private val _boxCoors: MutableStateFlow<HashMap<String, ArrayList<Float>>> = MutableStateFlow(HashMap())
  val boxCoors = _boxCoors.asStateFlow()

  /**
   * Setup image annotation microtask
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
  }

  /**
   * Set box Coors
   */
  fun setBoxCoors(boxCoors: HashMap<String, ArrayList<Float>>) {
    _boxCoors.value = boxCoors
  }

  /**
   * Handle next click
   */
  fun handleNextCLick() {
    val annotationsH = HashMap<String, JsonArray>()
    boxCoors.value.keys.forEach {
      val array = JsonArray()
      boxCoors.value[it]?.forEach { coor -> array.add(coor.toString()) }
      // Make a split on "_" and take the first element as the key
      val key = it.split("_")[0]
      if (annotationsH.containsKey(key)) {
        annotationsH[key]?.add(array)
      } else {
        val list = JsonArray()
        list.add(array)
        annotationsH[key] = list
      }
    }

    // Convert map to json
    val annotations = JsonObject()
    annotationsH.keys.forEach {
      annotations.add(it, annotationsH[it])
    }

    outputData.add("annotations", annotations)
    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

}
