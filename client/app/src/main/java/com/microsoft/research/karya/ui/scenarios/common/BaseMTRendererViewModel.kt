package com.microsoft.research.karya.ui.scenarios.common

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.OnLifecycleEvent
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
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.utils.DateUtils
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.MicrotaskAssignmentOutput
import com.microsoft.research.karya.utils.MicrotaskInput
import com.microsoft.research.karya.utils.extensions.getBlobPath
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.android.synthetic.main.microtask_header.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import javax.inject.Inject

@HiltViewModel
abstract class BaseMTRendererViewModel
constructor(
  private val taskId: String,
  private val incompleteMta: Int,
  private val completedMta: Int
) : ViewModel() {

  @Inject lateinit var assignmentRepository: AssignmentRepository
  @Inject lateinit var taskRepository: TaskRepository
  @Inject lateinit var microTaskRepository: MicroTaskRepository
  @Inject @FilesDir lateinit var fileDirPath: String
  @Inject lateinit var authManager: AuthManager

  // TODO: Mark First visited in Speech Data collection

  // Initialising containers
  private val assignmentOutputContainer = MicrotaskAssignmentOutput(fileDirPath)
  private val microtaskInputContainer = MicrotaskInput(fileDirPath)

  protected lateinit var task: TaskRecord
  private lateinit var microtaskAssignmentIDs: List<String>
  private var currentAssignmentIndex: Int = 0

  protected lateinit var currentMicroTask: MicroTaskRecord
  protected lateinit var currentAssignment: MicroTaskAssignmentRecord

  private var totalMicrotasks = incompleteMta + completedMta
  private var completedMicrotasks: Int = 0

  // Output fields for microtask assignment
  // TODO: Maybe make them a data class?
  protected var outputData: JsonObject = JsonObject()
  private var outputFiles: JsonArray = JsonArray()
  private var logs: JsonArray = JsonArray()

  init {
    viewModelScope.launch {
      task = taskRepository.getById(taskId)
      microtaskAssignmentIDs = assignmentRepository.getUnsubmittedIDsForTask(
        task.id,
        false
      ) // TODO: Generalise the includeCompleted parameter

      if (microtaskAssignmentIDs.isEmpty()) {
        // TODO: SET a flag to denote that there are no assignments
        //  and maybe show a corresponding dialogue box
      }
      // Move to the first incomplete (assigned) microtask or the last microtask
      do {
        val microtaskAssignmentID = microtaskAssignmentIDs[currentAssignmentIndex]
        val microtaskAssignment = assignmentRepository.getAssignmentById(microtaskAssignmentID)
        if (microtaskAssignment.status == MicrotaskAssignmentStatus.ASSIGNED) {
          break
        }
        currentAssignmentIndex++
      } while (currentAssignmentIndex < microtaskAssignmentIDs.size - 1)

      getAndSetupMicrotask()
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
  protected fun addOutputFile(params: Pair<String, String>) {
    val assignmentId = microtaskAssignmentIDs[currentAssignmentIndex]
    val fileName = assignmentOutputContainer.getAssignmentFileName(assignmentId, params)
    // Add file if it is not already present
    if (!outputFiles.contains(Gson().toJsonTree(fileName))) {
      outputFiles.add(fileName)
    }

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

    val output = JsonObject()
    output.add("data", outputData)
    output.add("files", outputFiles)
    output.add("logs", logs)

    val directory = File(getRelativePath("microtask-assignment-scratch"))
    val files = directory.listFiles()
    files?.forEach { if (it.exists()) it.delete() }

    /** Delete all scratch files */
    withContext(Dispatchers.IO) {
      assignmentRepository.markComplete(
        microtaskAssignmentIDs[currentAssignmentIndex],
        output,
        date = DateUtils.getCurrentDate()
      )
    }

    /** Update progress bar */
    if (currentAssignment.status == MicrotaskAssignmentStatus.ASSIGNED) {
      completedMicrotasks++
//      uiScope.launch { microtaskProgressPb?.progress = completedMicrotasks }
    }

  }

  /** Is there a next microtask (for navigation) */
  private fun hasNextMicrotask(): Boolean {
    return currentAssignmentIndex < (microtaskAssignmentIDs.size - 1)
  }

  /** Is there a previous microtask (for navigation) */
  private fun hasPreviousMicrotask(): Boolean {
    return currentAssignmentIndex > 0
  }

  /** Move to next microtask and setup. Returns false if there is no next microtask. Else true. */
  protected fun moveToNextMicrotask() {
    if (hasNextMicrotask()) {
      currentAssignmentIndex++
      getAndSetupMicrotask()
    } else {
      // TODO: Signal that all Microtasks are finsihed and finish
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
      // TODO: Signal that there are no previous microtasks in the UI and finish
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

      if (!currentAssignment.output.isJsonNull) {
        outputData =
          if (currentAssignment.output.asJsonObject.has("data")) {
            currentAssignment.output.asJsonObject.getAsJsonObject("data")
          } else {
            JsonObject()
          }

        logs =
          if (currentAssignment.output.asJsonObject.has("logs")) {
            currentAssignment.output.asJsonObject.getAsJsonArray("logs")
          } else {
            JsonArray()
          }

        outputFiles =
          if (currentAssignment.output.asJsonObject.has("files")) {
            currentAssignment.output.asJsonObject.getAsJsonArray("files")
          } else {
            JsonArray()
          }
      }

      setupMicrotask()
    }
  }


  private fun getRelativePath(s: String): String {
    return "$fileDirPath/$s"
  }

  /** Reset existing microtask. Useful on activity restart. */
  protected fun resetMicrotask() {
    getAndSetupMicrotask()
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
  /** Cleanup function called during [onStop]. */
  protected abstract fun cleanupOnStop() // Set on Base Viewmodel class

}