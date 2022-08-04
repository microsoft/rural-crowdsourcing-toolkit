package com.microsoft.research.karya.ui.scenarios.imageAnnotationVerification

import android.graphics.PointF
import android.util.Log
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.jsibbold.zoomage.enums.CropObjectType
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import javax.inject.Inject

@HiltViewModel
class ImageAnnotationVerificationViewModel
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

  // Labelled Polygon coordinates
  private val _polygonCoors: MutableStateFlow<Array<PointF>> = MutableStateFlow(arrayOf())
  val polygonCoors = _polygonCoors.asStateFlow()

  // score
  private val _validationScore: MutableStateFlow<Int> = MutableStateFlow(R.string.rating_undefined)
  val validationScore = _validationScore.asStateFlow()
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
   * Handle next click
   */
  fun handleNextCLick() {

    val score = when(_validationScore.value) {
      R.string.img_annotation_verification_ok -> 1
      R.string.img_annotation_verification_good -> 2
      else -> 0
    }

    outputData.addProperty("score", score)
    viewModelScope.launch {
      completeAndSaveCurrentMicrotask()
      moveToNextMicrotask()
    }
  }

  fun handleBackClick() {
    moveToPreviousMicrotask()
  }

  /**
   * Handle Score change
   */
  fun handleScoreChange(resId: Int) {
    _validationScore.value = resId
  }

//  TODO: Generalise this method as it only works for single polygon crop object
  fun setCoordinatesForBox() {
    val annotations = try {
      currentMicroTask.input.asJsonObject.getAsJsonObject("data").getAsJsonObject("annotations")
    } catch (e: Exception) {
      JsonObject()
    }

    // taking first label for now TODO: Generalise for all labels
    val label = annotations.keySet().elementAt(0)
    // Get coordinates with respect to a label for the first crop object
    val coorsJsonArray = annotations.getAsJsonArray(label).get(0).asJsonArray
    val coors = Array<PointF>(coorsJsonArray.size()) { PointF(0F, 0F)}

    for (i in coors.indices) {
      val ele = coorsJsonArray.get(i)
      val x = ele.asJsonArray.get(0).asFloat
      val y = ele.asJsonArray.get(1).asFloat
      coors[i] = PointF(x, y)
    }
    _polygonCoors.value = coors

    // Reset validation score
    _validationScore.value = R.string.rating_undefined
  }

}
