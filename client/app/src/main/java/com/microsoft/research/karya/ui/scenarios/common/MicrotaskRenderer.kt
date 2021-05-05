// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.scenarios.common

import android.app.AlertDialog
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.manager.KaryaDatabase
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.ui.assistant.Assistant
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.DateUtils.getCurrentDate
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.extensions.getBlobPath
import com.microsoft.research.karya.utils.extensions.getContainerDirectory
import java.io.File
import kotlinx.android.synthetic.main.microtask_header.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

/** Code to request necessary permissions */
private const val REQUEST_PERMISSIONS = 201

/**
 * Abstract microtask renderer class. Each scenario supported in the karya platform should implement
 * this interface.
 */
abstract class MicrotaskRenderer(
  private val activityName: String,
  private val includeCompleted: Boolean,
  private val finishOnGroupBoundary: Boolean
) : AppCompatActivity() {

    /**Assistant*/
    protected lateinit var assistant: Assistant

  protected lateinit var task: TaskRecord
  private lateinit var microtaskAssignmentIDs: List<String>
  private var currentAssignmentIndex: Int = 0
  private var currentMicrotaskGroupId: String? = null

  protected lateinit var currentMicroTask: MicroTaskRecord
  protected lateinit var currentAssignment: MicroTaskAssignmentRecord

  private var totalMicrotasks: Int = 0
  private var completedMicrotasks: Int = 0

    /** Coroutine scopes */
    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    // TODO: Remove Database calls from here, call from repository in the viewmodel
    protected lateinit var karyaDb: KaryaDatabase

    // TODO: Remove this
    protected lateinit var setWorkerJob: Job
    protected lateinit var thisWorker: WorkerRecord

  // Output fields for microtask assignment
  protected var outputData: JsonObject = JsonObject()
  private var outputFiles: JsonArray = JsonArray()
  private var logs: JsonArray = JsonArray()

  // Microtask loading job
  private lateinit var microtaskLoadingJob: Job

  // Flag to indicate if app has all permissions
  private var hasAllPermissions: Boolean = true

  // Flag to indicate if this is the first time the user is performing the task
  protected var firstTimeActivityVisit: Boolean = false

  /** Function to return the set of permission needed for the task */
  open fun requiredPermissions(): Array<String> {
    return arrayOf()
  }

  /**
   * Setup the view for the microtask renderer. Called at the end of the [onCreate]. This function
   * can also be used to extract specific objects in the views.
   */
  protected abstract fun setupActivity()

  /** Cleanup function called during [onStop]. */
  protected abstract fun cleanupOnStop()

  /** Reset activity on restart. Called during [onRestart] */
  protected abstract fun resetOnRestart()

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

  /** Add a string message to the log */
  protected fun log(message: String) {
    val logObj = JsonObject()
    val currentTime = getCurrentDate()
    logObj.add("ts", Gson().toJsonTree(currentTime))
    logObj.add("message", Gson().toJsonTree(message))
    logs.add(logObj)
  }

  /** Add a string message to the log */
  protected fun log(obj: JsonObject) {
    val logObj = JsonObject()
    val currentTime = getCurrentDate()
    logObj.addProperty("ts", currentTime)
    logObj.add("message", obj)
    logs.add(logObj)
  }

  /** Add a file to the assignment with the given output */
  protected fun addOutputFile(params: Pair<String, String>) {
    val fileName = getAssignmentFileName(params)
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

  /** Get the file path for an output file for the current assignment and [params] pair */
  protected fun getAssignmentOutputFilePath(params: Pair<String, String>): String {
    val directory = getContainerDirectory(BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT)
      // TODO: Remove KaryaFileContainer from BaseActivity
    val fileName = getAssignmentFileName(params)
    return "$directory/$fileName"
  }

  /** Get the file path for a scratch file for the current assignment and [params] pair */
  protected fun getAssignmentScratchFilePath(params: Pair<String, String>): String {
    val directory = getDir("microtask-assignment-scratch", Context.MODE_PRIVATE)
    val fileName = getAssignmentFileName(params)
    return "${directory.path}/$fileName"
  }

  /** Get the file path for an output file for the current assignment and [params] pair */
  protected fun getAssignmentOutputFile(params: Pair<String, String>): File {
    val filePath = getAssignmentOutputFilePath((params))
    val file = File(filePath)
    if (file.exists()) file.delete()
    file.createNewFile()
    return file
  }

  /** Get the file path for an output file for the current assignment and [params] pair */
  protected fun getAssignmentScratchFile(params: Pair<String, String>): File {
    val filePath = getAssignmentScratchFilePath(params)
    val file = File(filePath)
    if (file.exists()) file.delete()
    file.createNewFile()
    return file
  }

  /** Get Microtask input directory */
  private fun getMicrotaskInputDirectory(): String {
    val microtaskInputName = BaseActivity.KaryaFileContainer.MICROTASK_INPUT.cname
    val microtaskId = currentMicroTask.id
    val microtaskInputDirectory = getDir("${microtaskInputName}_$microtaskId", MODE_PRIVATE)
    return microtaskInputDirectory.path
  }

  /** Get microtask input file path */
  protected fun getMicrotaskInputFilePath(fileName: String): String {
    val microtaskInputDirectory = getMicrotaskInputDirectory()
    return "$microtaskInputDirectory/$fileName"
  }

  /**
   * Mark the current microtask as complete with the [outputData], [outputFiles], and [logs]
   * attached to the current assignment's output field. Delete all scratch files.
   */
  protected suspend fun completeAndSaveCurrentMicrotask() {
    /** Delete all scratch files */
    val deleteScratchFilesJob =
      ioScope.launch {
        val directory = getDir("microtask-assignment-scratch", Context.MODE_PRIVATE)
        val files = directory.listFiles()
        files?.forEach { if (it.exists()) it.delete() }
      }

    val output = JsonObject()
    output.add("data", outputData)
    output.add("files", outputFiles)
    output.add("logs", logs)

    karyaDb
      .microtaskAssignmentDaoExtra()
      .markComplete(microtaskAssignmentIDs[currentAssignmentIndex], output, date = getCurrentDate())

    /** Update progress bar */
    if (currentAssignment.status == MicrotaskAssignmentStatus.assigned) {
      completedMicrotasks++
      uiScope.launch { microtaskProgressPb?.progress = completedMicrotasks }
    }

    deleteScratchFilesJob.join()
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
      finish()
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
      finish()
    }
  }

  /** Reset existing microtask. Useful on activity restart. */
  protected fun resetMicrotask() {
    getAndSetupMicrotask()
  }

  /**
   * On create, set [karyaDb]. extract the taskID from Intent and fetch the [task] object from the
   * db. If either of these is not set, then display an error and go back to the dashboard. Fetch
   * all [microtaskAssignmentIDs] for the current task. Set the [currentAssignmentIndex] pointer
   * appropriately.
   */
  final override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

      // Setting up assistant
      assistant = Assistant(this)

      // Set db and API service
      karyaDb = KaryaDatabase.getInstance(this)!!

    val taskId = intent.extras?.get("taskID") as String
    val incomplete = intent.extras?.getInt("incomplete")!!
    val completed = intent.extras?.getInt("completed")!!

    totalMicrotasks = incomplete + completed
    completedMicrotasks = completed

    runBlocking {
      /** Fetch the task */
      ioScope.launch { task = karyaDb.taskDao().getById(taskId) }.join()

        //TODO: Maybe pass an intent extra rather than storing in database
      ioScope.launch {
          firstTimeActivityVisit =
              try {
                  !thisWorker.params!!.get(activityName).asBoolean
              } catch (e: Exception) {
                  true
              }
      }

      /** Mark the activity as visited */

        // TODO: Set worker from database
      setWorker()
    }

    setupActivity()

    /** Fetch all microtask assignments and point to first incomplete assignment */
    microtaskLoadingJob =
      ioScope.launch {
        microtaskAssignmentIDs =
          karyaDb.microtaskAssignmentDaoExtra().getUnsubmittedIDsForTask(task.id, includeCompleted)

        // If there are no microtasks, move back to the dashboard
        if (microtaskAssignmentIDs.isEmpty()) {
          finish()
        }

        // Move to the first incomplete (assigned) microtask or the last microtask
        do {
          val microtaskAssignmentID = microtaskAssignmentIDs[currentAssignmentIndex]
          val microtaskAssignment = karyaDb.microtaskAssignmentDao().getById(microtaskAssignmentID)
          if (microtaskAssignment.status == MicrotaskAssignmentStatus.assigned) {
            break
          }
          currentAssignmentIndex++
        } while (currentAssignmentIndex < microtaskAssignmentIDs.size - 1)
      }

    /** Check if there are any permissions needed */
    val permissions = requiredPermissions()
    if (permissions.isNotEmpty()) {
      for (permission in permissions) {
        if (ActivityCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
          hasAllPermissions = false
          ActivityCompat.requestPermissions(this, permissions, REQUEST_PERMISSIONS)
          break
        }
      }
    }
  }
    // TODO: Remove this
    /** Set worker */
    private fun setWorker() {
        setWorkerJob =
            ioScope.launch {
                val workers = karyaDb.workerDao().getAll()
                if (workers.isNotEmpty()) thisWorker = workers[0]
                activityVisited()
            }

    }

  /** On resume, get and setup the microtask */
  override fun onResume() {
    super.onResume()
    if (hasAllPermissions) {
      ioScope.launch {
        // get and setup microtask immediately
        microtaskLoadingJob.join()
        getAndSetupMicrotask()
      }

      microtaskProgressPb?.max = totalMicrotasks
      microtaskProgressPb?.progress = completedMicrotasks
    }
  }

  private suspend fun activityVisited() {
    val params = thisWorker.params
    params!!.addProperty(activityName, true)
    ioScope.launch { karyaDb.workerDao().updateParamsForId(params, thisWorker.id) }
  }

  /** On permission result, if any permission is not granted, return immediately */
  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray,
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)

    /** If request code does not belong to this activity, return */
    if (requestCode != REQUEST_PERMISSIONS) return

    /** If any of the permissions were not granted, return */
    for (result in grantResults) {
      if (result != PackageManager.PERMISSION_GRANTED) {
        finish()
        return
      }
    }

    hasAllPermissions = true
  }

  /** On stop, just cleanup */
  final override fun onStop() {
    super.onStop()
    cleanupOnStop()
  }

  /** On restart, just reset */
  final override fun onRestart() {
    super.onRestart()
    resetOnRestart()
  }

  /** On destroy, just called super */
  final override fun onDestroy() {
    super.onDestroy()
  }

  /** Get the microtask record for the current assignment and setup the microtask */
  private fun getAndSetupMicrotask() {
    runBlocking {
      val assignmentID = microtaskAssignmentIDs[currentAssignmentIndex]

      // Fetch the assignment and the microtask
      ioScope
        .launch {
          currentAssignment = karyaDb.microtaskAssignmentDao().getById(assignmentID)
          currentMicroTask = karyaDb.microTaskDao().getById(currentAssignment.microtask_id)
        }
        .join()

      /** If microtask has input files, extract them */
      var microtaskInputFileJob: Job? = null
      var inputFileDoesNotExist = false
      if (currentMicroTask.input_file_id != null) {
        val microtaskTarBallPath = getBlobPath(BaseActivity.KaryaFileContainer.MICROTASK_INPUT, currentMicroTask.id)
        val microtaskInputDirectory = getMicrotaskInputDirectory()

        if (!File(microtaskTarBallPath).exists()) {
          inputFileDoesNotExist = true
          uiScope.launch {
            /** Input files were not downloaded fully */
            val alertDialogBuilder = AlertDialog.Builder(this@MicrotaskRenderer)
            alertDialogBuilder.setMessage(
              "Input files were not fully downloaded. Please sync with server to download all files"
            )
            alertDialogBuilder.setPositiveButton("Okay") { _, _ -> finish() }
            val alertDialog = alertDialogBuilder.create()
            alertDialog.show()
          }
        } else {
          microtaskInputFileJob =
            ioScope.launch {
              FileUtils.extractGZippedTarBallIntoDirectory(microtaskTarBallPath, microtaskInputDirectory)
            }
        }
      }

      if (inputFileDoesNotExist) return@runBlocking

      // Check if we are in a group boundary and finish if necessary
      if (finishOnGroupBoundary &&
          currentMicrotaskGroupId != null &&
          currentMicroTask.group_id != null &&
          currentMicroTask.group_id != currentMicrotaskGroupId
      ) {
        finish()
      }
      currentMicrotaskGroupId = currentMicroTask.group_id

      outputData =
        if (currentAssignment.output.has("data")) {
          currentAssignment.output.getAsJsonObject("data")
        } else {
          JsonObject()
        }

      logs =
        if (currentAssignment.output.has("logs")) {
          currentAssignment.output.getAsJsonArray("logs")
        } else {
          JsonArray()
        }

      outputFiles =
        if (currentAssignment.output.has("files")) {
          currentAssignment.output.getAsJsonArray("files")
        } else {
          JsonArray()
        }

      // setup microtask
      uiScope.launch {
        microtaskInputFileJob?.join()
        setupMicrotask()
      }
    }
  }

  protected fun getAudioFilePath(audioResourceId: Int): String {
    return getBlobPath(
      BaseActivity.KaryaFileContainer.LANG_RES,
      audioResourceId.toString(),
      thisWorker.appLanguage.toString()
    )
  }
}
