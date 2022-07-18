package com.microsoft.research.karya.ui.scenarios.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.MicrotaskAssignmentOutput
import com.microsoft.research.karya.utils.MicrotaskInput
import com.microsoft.research.karya.utils.extensions.getBlobPath
import java.io.File
import kotlin.properties.Delegates
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

abstract class BaseFeedbackRendererViewModel
constructor(
  var assignmentRepository: AssignmentRepository,
  var taskRepository: TaskRepository,
  var microTaskRepository: MicroTaskRepository,
  var fileDirPath: String,
  var authManager: AuthManager,
  val includeCompleted: Boolean = false
) : ViewModel() {

  private lateinit var taskId: String
  private var verifiedAssignments by Delegates.notNull<Int>()

  // Initialising containers
  val assignmentOutputContainer = MicrotaskAssignmentOutput(fileDirPath)
  val microtaskInputContainer = MicrotaskInput(fileDirPath)

  lateinit var task: TaskRecord
  protected lateinit var microtaskAssignmentIDs: List<String>
  protected var currentAssignmentIndex: Int = 0

  lateinit var currentMicroTask: MicroTaskRecord
  protected lateinit var currentAssignment: MicroTaskAssignmentRecord

  protected var completedMicrotasks: Int = 0

  protected var outputData: JsonObject = JsonObject()
  protected var outputFiles: JsonObject = JsonObject()

  // Output fields for microtask assignment
  private val _navigateBack: MutableSharedFlow<Boolean> = MutableSharedFlow(1)
  val navigateBack = _navigateBack.asSharedFlow()

  protected fun navigateBack() {
    viewModelScope.launch { _navigateBack.emit(true) }
  }

  open fun setupViewModel(taskId: String, verifiedMTA: Int) {
    this.taskId = taskId
    this.verifiedAssignments = verifiedMTA

    // TODO: Shift this to init once we move to viewmodel factory
    runBlocking {
      task = taskRepository.getById(taskId)
      microtaskAssignmentIDs = assignmentRepository.getLocalVerifiedAssignments(task.id)

      if (microtaskAssignmentIDs.isEmpty()) {
        navigateBack()
      }
    }
  }

  /**
   * Setup microtask after updating [currentAssignmentIndex]. Called at the end of [onResume], and navigating to next or
   * previous tasks
   */
  protected abstract fun setupMicrotask()

  /** Is there a next microtask (for navigation) */
  protected fun hasNextMicrotask(): Boolean {
    return currentAssignmentIndex < (microtaskAssignmentIDs.size - 1)
  }

  /** Is there a previous microtask (for navigation) */
  protected fun hasPreviousMicrotask(): Boolean {
    return currentAssignmentIndex > 0
  }

  /** Move to next microtask and setup. Returns false if there is no next microtask. Else true. */
  protected fun moveToNextMicrotask() {
    viewModelScope.launch { deleteOutputFiles() }
    if (hasNextMicrotask()) {
      currentAssignmentIndex++
      getAndSetupMicrotask()
    } else {
      navigateBack()
    }
  }

  /** Move to previous microtask and setup. Returns false if there is no previous microtask. Else true */
  protected fun moveToPreviousMicrotask() {
    viewModelScope.launch { deleteOutputFiles() }
    if (hasPreviousMicrotask()) {
      currentAssignmentIndex--
      getAndSetupMicrotask()
    } else {
      navigateBack()
    }
  }

  private fun deleteOutputFiles() {
    val directory = assignmentOutputContainer.getDirectory()
    val assignmentOutputFiles =
      try {
        val outputFilesDict = currentAssignment.output.asJsonObject.getAsJsonObject("files")
        val outputFiles = arrayListOf<String>()
        outputFilesDict.keySet().forEach { k -> outputFiles.add(outputFilesDict.get(k).asString) }
        outputFiles
      } catch (e: Exception) {
        arrayListOf<String>()
      }
    assignmentOutputFiles.forEach {
      val filePath = "$directory/$it"
      if (File(filePath).exists()) File(filePath).delete()
    }
  }

  /** Get the microtask record for the current assignment and setup the microtask */
  fun getAndSetupMicrotask() {
    viewModelScope.launch {
      val assignmentID = microtaskAssignmentIDs[currentAssignmentIndex]

      // Fetch the assignment and the microtask
      currentAssignment = assignmentRepository.getAssignmentById(assignmentID)
      currentMicroTask = microTaskRepository.getById(currentAssignment.microtask_id)

      /** If microtask has input files, extract them */
      var inputFileDoesNotExist = false
      if (currentMicroTask.input_file_id != null) {
        val microtaskTarBallPath = microtaskInputContainer.getBlobPath(currentMicroTask.id)
        val microtaskInputDirectory = microtaskInputContainer.getMicrotaskInputDirectory(currentMicroTask.id)

        if (!File(microtaskTarBallPath).exists()) {
          inputFileDoesNotExist = true
          // TODO: Create a MutableLiveData to inform the UI about an alertbox
        } else {
          FileUtils.extractGZippedTarBallIntoDirectory(microtaskTarBallPath, microtaskInputDirectory)
        }
      }

      if (inputFileDoesNotExist) return@launch

      if (!currentAssignment.output.isJsonNull) {
        outputData =
          if (currentAssignment.output.asJsonObject.has("data")) {
            currentAssignment.output.asJsonObject.getAsJsonObject("data")
          } else {
            JsonObject()
          }

        outputFiles =
          if (currentAssignment.output.asJsonObject.has("files")) {
            currentAssignment.output.asJsonObject.getAsJsonObject("files")
          } else {
            JsonObject()
          }
      }

      setupMicrotask()
    }
  }

  /**
   * Get the unique file name of the output for current assignment. [params] is a pair of strings: a file identifier and
   * extension. The file name is usually the current assignmentID appended with the identifier. The full file name is
   * unique for a unique [params] pair.
   */
  private fun getAssignmentFileName(params: Pair<String, String>): String {
    val identifier = params.first
    val extension = params.second
    val assignmentId = microtaskAssignmentIDs[currentAssignmentIndex]

    return if (identifier == "") "$assignmentId.$extension" else "$assignmentId-$identifier.$extension"
  }

  /** Reset existing microtask. Useful on activity restart. */
  protected fun resetMicrotask() {
    getAndSetupMicrotask()
  }
}
