package com.microsoft.research.karya.ui.scenarios.common

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.utils.DateUtils
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.MicrotaskAssignmentOutput
import com.microsoft.research.karya.utils.MicrotaskInput
import com.microsoft.research.karya.utils.extensions.getBlobPath
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.properties.Delegates

abstract class BaseMTRendererViewModel
constructor(
  var assignmentRepository: AssignmentRepository,
  var taskRepository: TaskRepository,
  var microTaskRepository: MicroTaskRepository,
  var fileDirPath: String,
  var authManager: AuthManager,
  val includeCompleted: Boolean = false
) : ViewModel() {

  private lateinit var taskId: String
  private var incompleteAssignments by Delegates.notNull<Int>()
  private var completedAssignments by Delegates.notNull<Int>()

  // Initialising containers
  val assignmentOutputContainer = MicrotaskAssignmentOutput(fileDirPath)
  val microtaskInputContainer = MicrotaskInput(fileDirPath)

  lateinit var task: TaskRecord
  protected lateinit var microtaskAssignmentIDs: List<String>
  protected var currentAssignmentIndex: Int = 0

  lateinit var currentMicroTask: MicroTaskRecord
  protected lateinit var currentAssignment: MicroTaskAssignmentRecord

  //  protected var totalMicrotasks = incompleteMta + completedMta
  protected var completedMicrotasks: Int = 0

  // Output fields for microtask assignment
  // TODO: Maybe make them a data class?
  protected var outputData: JsonObject = JsonObject()
  protected var outputFiles: JsonObject = JsonObject()
  protected var logs: JsonArray = JsonArray()

  private val _navigateBack: MutableSharedFlow<Boolean> = MutableSharedFlow(1)
  val navigateBack = _navigateBack.asSharedFlow()

  protected fun navigateBack() {
    viewModelScope.launch { _navigateBack.emit(true) }
  }

  open fun setupViewModel(taskId: String, incompleteMta: Int, completedMta: Int) {
    this.taskId = taskId
    this.incompleteAssignments = incompleteMta
    this.completedAssignments = completedMta

    // TODO: Shift this to init once we move to viewmodel factory
    runBlocking {
      task = taskRepository.getById(taskId)
      microtaskAssignmentIDs =
        assignmentRepository.getUnsubmittedIDsForTask(
          task.id,
          includeCompleted
        ) // TODO: Generalise the includeCompleted parameter (Can be done when we have viewModel
      // factory)

      if (microtaskAssignmentIDs.isEmpty()) {
        navigateBack()
      }

      // Move to the first incomplete (assigned) microtask or the last microtask
      while (currentAssignmentIndex < microtaskAssignmentIDs.size - 1) {
        val microtaskAssignmentID = microtaskAssignmentIDs[currentAssignmentIndex]
        val microtaskAssignment = assignmentRepository.getAssignmentById(microtaskAssignmentID)
        if (microtaskAssignment.status == MicrotaskAssignmentStatus.ASSIGNED) {
          break
        }
        currentAssignmentIndex++
      }
    }
  }

  /**
   * Setup microtask after updating [currentAssignmentIndex]. Called at the end of [onResume], and
   * navigating to next or previous tasks
   */
  protected abstract fun setupMicrotask()

  /** Set the output for an assignment */
  protected fun setOutput(output: JsonObject) {
    outputData = output
  }

  /** Set output property */

  // TODO: Move logging to another module
  /** Add a string message to the log */
  protected fun log(message: String) {
    val logObj = JsonObject()
    val currentTime = DateUtils.getCurrentDate()
    logObj.add("ts", Gson().toJsonTree(currentTime))
    logObj.add("message", Gson().toJsonTree(message))
    logs.add(logObj)
  }

  /** Add a string message to the log */
  protected fun log(obj: JsonObject) {
    val logObj = JsonObject()
    val currentTime = DateUtils.getCurrentDate()
    logObj.addProperty("ts", currentTime)
    logObj.add("message", obj)
    logs.add(logObj)
  }

  /** Add a file to the assignment with the given output */
  protected fun addOutputFile(key: String, params: Pair<String, String>) {
    val assignmentId = microtaskAssignmentIDs[currentAssignmentIndex]
    val fileName = assignmentOutputContainer.getAssignmentFileName(assignmentId, params)

    outputFiles.addProperty(key, fileName)

    // log the output file addition
    val logObj = JsonObject()
    logObj.addProperty("type", "output-file")
    logObj.addProperty("filename", fileName)
    log(logObj)
  }

  /**
   * Mark the current microtask as complete with the [outputData], [outputFiles], and [logs]
   * attached to the current assignment's output field. Delete all scratch files.
   */
  protected suspend fun completeAndSaveCurrentMicrotask() {

    val output = buildOutputJsonObject()
    val logObj = JsonObject()
    logObj.add("logs", logs)

    deleteAssignmentScratchFiles()

    /** Delete all scratch files */
    withContext(Dispatchers.IO) {
      assignmentRepository.markComplete(
        microtaskAssignmentIDs[currentAssignmentIndex],
        output,
        logObj,
        date = DateUtils.getCurrentDate()
      )
    }
  }

  protected suspend fun skipAndSaveCurrentMicrotask() {
    /** Delete all scratch files */
    withContext(Dispatchers.IO) {
      assignmentRepository.markSkip(
        microtaskAssignmentIDs[currentAssignmentIndex],
        date = DateUtils.getCurrentDate()
      )
    }
  }

  private fun deleteAssignmentScratchFiles() {
    val directory = File(getRelativePath("microtask-assignment-scratch"))
    val files = directory.listFiles()
    files?.forEach { if (it.exists()) it.delete() }
  }

  private fun buildOutputJsonObject(): JsonObject {
    val output = JsonObject()
    output.add("data", outputData)
    output.add("files", outputFiles)
    return output
  }

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
    if (hasNextMicrotask()) {
      currentAssignmentIndex++
      getAndSetupMicrotask()
    } else {
      navigateBack()
    }
  }

  /**
   * Move to previous microtask and setup. Returns false if there is no previous microtask. Else
   * true
   */
  protected fun moveToPreviousMicrotask() {
    if (hasPreviousMicrotask()) {
      currentAssignmentIndex--
      getAndSetupMicrotask()
    } else {
      navigateBack()
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
        val microtaskInputDirectory =
          microtaskInputContainer.getMicrotaskInputDirectory(currentMicroTask.id)

        if (!File(microtaskTarBallPath).exists()) {
          inputFileDoesNotExist = true
          // TODO: Create a MutableLiveData to inform the UI about an alertbox
        } else {
          FileUtils.extractGZippedTarBallIntoDirectory(
            microtaskTarBallPath,
            microtaskInputDirectory
          )
        }
      }

      if (inputFileDoesNotExist) return@launch

      outputData =
        if (!currentAssignment.output.isJsonNull && currentAssignment.output.asJsonObject.has("data")) {
          currentAssignment.output.asJsonObject.getAsJsonObject("data")
        } else {
          JsonObject()
        }

      outputFiles =
        if (!currentAssignment.output.isJsonNull && currentAssignment.output.asJsonObject.has("files")) {
          currentAssignment.output.asJsonObject.getAsJsonObject("files")
        } else {
          JsonObject()
        }

      logs =
        if (!currentAssignment.logs.isJsonNull && currentAssignment.logs.asJsonObject.has("logs")) {
          currentAssignment.logs.asJsonObject.getAsJsonArray("logs")
        } else {
          JsonArray()
        }

      setupMicrotask()
    }
  }

  protected fun getRelativePath(s: String): String {
    return "$fileDirPath/$s"
  }

  /**
   * Get the unique file name of the output for current assignment. [params] is a pair of strings: a
   * file identifier and extension. The file name is usually the current assignmentID appended with
   * the identifier. The full file name is unique for a unique [params] pair.
   */
  private fun getAssignmentFileName(params: Pair<String, String>): String {
    val identifier = params.first
    val extension = params.second
    val assignmentId = microtaskAssignmentIDs[currentAssignmentIndex]

    return if (identifier == "") "$assignmentId.$extension" else "$assignmentId-$identifier.$extension"
  }

  /** Get the file path for a scratch file for the current assignment and [params] pair */
  protected fun getAssignmentScratchFilePath(params: Pair<String, String>): String {
    val dir_path = "$fileDirPath/microtask-assignment-scratch"
    val dir = File(dir_path)
    dir.mkdirs()
    val fileName = getAssignmentFileName(params)
    return "$dir_path/$fileName"
  }

  /** Get the file path for an output file for the current assignment and [params] pair */
  // TODO: Move Scratch File functions to Karya Containers
  protected fun getAssignmentScratchFile(params: Pair<String, String>): File {
    val filePath = getAssignmentScratchFilePath(params)
    val file = File(filePath)
    if (file.exists()) file.delete()
    file.createNewFile()
    return file
  }

  /** Reset existing microtask. Useful on activity restart. */
  protected fun resetMicrotask() {
    getAndSetupMicrotask()
  }
}
