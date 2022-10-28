package com.microsoft.research.karya.ui.scenarios.imageAnnotation

import android.graphics.RectF
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.jsibbold.zoomage.dataClass.Polygon
import com.jsibbold.zoomage.enums.CropObjectType
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

  // Labelled Box coordinates
  private val _rectangleCoors: MutableStateFlow<HashMap<String, RectF>> = MutableStateFlow(HashMap())
  val rectangleCoors = _rectangleCoors.asStateFlow()

  // Labelled Polygon coordinates
  private val _polygonCoors: MutableStateFlow<HashMap<String, Polygon>> = MutableStateFlow(HashMap())
  val polygonCoors = _polygonCoors.asStateFlow()

  // Annotation type
  var annotationType = CropObjectType.RECTANGLE;
  // Number of sides
  var numberOfSides = 4;
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
    // Get image annotation type
    val annotationTypeString = try {
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("annotationType").asString
    } catch (e: Exception) {
      "RECTANGLE"
    }

    annotationType = if (annotationTypeString == "POLYGON") CropObjectType.POLYGON
      else CropObjectType.RECTANGLE

    // Get number of sides
    numberOfSides = try {
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").get("numberOfSides").asInt
    } catch (e: Exception) {
      // Since default shape is rectangle
      4
    }
  }

  /**
   * Set box Coors
   */
  fun setRectangleCoors(boxCoors: HashMap<String, RectF>) {
    _rectangleCoors.value = boxCoors
  }

  /**
   * Set polygon Coors
   */
  fun setPolygonCoors(polygonCoors: HashMap<String, Polygon>) {
    _polygonCoors.value = polygonCoors
  }

  /**
   * Handle next click
   */
  fun handleNextCLick() {
    var annotationsH = HashMap<String, JsonArray>();
    if (annotationType == CropObjectType.RECTANGLE) {
      annotationsH = getRectangleAnnotation()
    } else {
      annotationsH = getPolygonAnnotation()
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

  /**
   * Get Rectangle annotations
   */
  fun getRectangleAnnotation(): HashMap<String, JsonArray> {
    val annotationsH = HashMap<String, JsonArray>()
    rectangleCoors.value.keys.forEach {
      val coordinates = JsonArray()
      val rectF = rectangleCoors.value[it]!!
      // Add coordinates in the JSON array
      coordinates.add(rectF.left)
      coordinates.add(rectF.top)
      coordinates.add(rectF.right)
      coordinates.add(rectF.bottom)
      // Make a split on "_" and take the first element as the key
      val key = it.split("_")[0]
      if (annotationsH.containsKey(key)) {
        annotationsH[key]?.add(coordinates)
      } else {
        val list = JsonArray()
        list.add(coordinates)
        annotationsH[key] = list
      }
    }
    return annotationsH;
  }

  /**
   * Get Polygon Annotation
   */
  private fun getPolygonAnnotation(): HashMap<String, JsonArray> {
    val annotationsH = HashMap<String, JsonArray>()
    polygonCoors.value.keys.forEach {
      val coordinates = JsonArray()
      val polygon = polygonCoors.value[it]!!
      // Add coordinates in the JSON array
      for (point in polygon.points) {
        val coor = JsonArray()
        coor.add(point.x)
        coor.add(point.y)
        coordinates.add(coor)
      }
      // Make a split on "_" and take the first element as the key
      val key = it.split("_")[0]
      if (annotationsH.containsKey(key)) {
        annotationsH[key]?.add(coordinates)
      } else {
        val list = JsonArray()
        list.add(coordinates)
        annotationsH[key] = list
      }
    }
    return annotationsH;
  }

}
