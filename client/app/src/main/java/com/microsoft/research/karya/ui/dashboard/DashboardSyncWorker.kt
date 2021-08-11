package com.microsoft.research.karya.ui.dashboard

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ChecksumAlgorithm
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.remote.request.UploadFileRequest
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.utils.DateUtils
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.MicrotaskAssignmentOutput
import com.microsoft.research.karya.utils.MicrotaskInput
import com.microsoft.research.karya.utils.extensions.getBlobPath
import kotlinx.coroutines.flow.collect
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import java.io.File

private const val MAX_UPLOAD_PROGRESS = 25
private const val MAX_SEND_DB_UPDATES_PROGRESS = 40
private const val MAX_RECEIVE_DB_UPDATES_PROGRESS = 55
private const val MAX_DOWNLOAD_PROGRESS = 80
private const val MAX_FETCH_VERIFIED_PROGRESS = 90
private const val MAX_CLEANUP_PROGRESS = 100

class DashboardSyncWorker(
  appContext: Context,
  workerParams: WorkerParameters,
  private val assignmentRepository: AssignmentRepository,
  private val karyaFileRepository: KaryaFileRepository,
  private val microTaskRepository: MicroTaskRepository,
  @FilesDir private val fileDirPath: String,
  private val authManager: AuthManager,
) : CoroutineWorker(appContext, workerParams) {

  private val microtaskOutputContainer = MicrotaskAssignmentOutput(fileDirPath)
  private val microtaskInputContainer = MicrotaskInput(fileDirPath)

  private var warningMsg: String? = null

  override suspend fun doWork(): Result {

    return try {

      syncWithServer()

      Result.success(Data.Builder().putString("warningMsg", warningMsg).build())
    } catch (e: Exception) {
      // Send the error message
      Result.failure(Data.Builder().putString("errorMsg", e.message).build())
    }
  }

  suspend fun syncWithServer() {
    uploadOutputFiles()
    setProgressAsync(Data.Builder().putInt("progress", MAX_UPLOAD_PROGRESS).build())
    sendDbUpdates()
    setProgressAsync(Data.Builder().putInt("progress", MAX_SEND_DB_UPDATES_PROGRESS).build())
    receiveDbUpdates()
    setProgressAsync(Data.Builder().putInt("progress", MAX_RECEIVE_DB_UPDATES_PROGRESS).build())
    downloadInputFiles()
    setProgressAsync(Data.Builder().putInt("progress", MAX_DOWNLOAD_PROGRESS).build())
    fetchVerifiedAssignments()
    setProgressAsync(Data.Builder().putInt("progress", MAX_FETCH_VERIFIED_PROGRESS).build())
    cleanupKaryaFiles()
    setProgressAsync(Data.Builder().putInt("progress", MAX_CLEANUP_PROGRESS).build())
  }

  /** Upload the Files of completed Assignments */
  private suspend fun uploadOutputFiles() {
    val updates = assignmentRepository.getLocalCompletedAssignments()

    val filteredAssignments =
      updates.filter {
        // output_file_id is the id of the file in the blob storage(cloud) and will be non-empty if
        // the file was already uploaded
        it.output_file_id == null && !it.output.isJsonNull && it.output.asJsonObject.get("files").asJsonObject.size() > 0
      }

    var count = 0
    for (assignment in filteredAssignments) {
      try {
        val assignmentTarBallPath = microtaskOutputContainer.getBlobPath(assignment.id)
        val tarBallName = microtaskOutputContainer.getBlobName(assignment.id)
        val outputDir = microtaskOutputContainer.getDirectory()
        val outputFiles = assignment.output.asJsonObject.get("files").asJsonObject
        val fileNames = outputFiles.keySet().map { it -> outputFiles.get(it).asString }
        val outputFilePaths = fileNames.map { "$outputDir/${it}" }
        FileUtils.createTarBall(assignmentTarBallPath, outputFilePaths, fileNames)
        uploadTarBall(assignment, assignmentTarBallPath, tarBallName)
        count += 1
        val localProgress = (count * MAX_UPLOAD_PROGRESS) / filteredAssignments.size
        setProgressAsync(Data.Builder().putInt("progress", localProgress).build())
      } catch (e: Exception) {
        // The assignments for which output file can not be prepared, mark them assigned.
        assignmentRepository.markAssigned(assignment.id, DateUtils.getCurrentDate())
        warningMsg = applicationContext.getString(R.string.FAILED_UPLOAD_RECORD_AGAIN_MSG)
        Log.e("UPLOAD_OUTPUT_FILE", "Failed to prepare output file for the assignment")
      }
    }
  }

  private suspend fun sendDbUpdates() {
    val worker = authManager.fetchLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    // Get completed assignments from the database
    val completedAssignments =
      assignmentRepository.getLocalCompletedAssignments().filter {
        it.output.isJsonNull || it.output.asJsonObject.get("files").asJsonObject.size() == 0 || it.output_file_id !=
          null
      }
    // Submit the completed assignments
    assignmentRepository
      .submitCompletedAssignments(worker.idToken, completedAssignments)
      .collect { assignmentIds -> assignmentRepository.markMicrotaskAssignmentsSubmitted(assignmentIds) }

    // Get skipped assignments from the database
    val skippedAssignments = assignmentRepository.getLocalSkippedAssignments()
    // Submit the skipped assignments
    assignmentRepository //TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .submitSkippedAssignments(worker.idToken, skippedAssignments)
      .collect { assignmentIds -> assignmentRepository.markMicrotaskAssignmentsSubmitted(assignmentIds) }
  }

  private suspend fun receiveDbUpdates() {
    val worker = authManager.fetchLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val from = assignmentRepository.getNewAssignmentsFromTime(worker.id)

    // Get Assignment DB updates
    assignmentRepository //TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .getNewAssignments(worker.idToken, from)
//      .catch { _dashboardUiState.value = DashboardUiState.Error(it) }
      .collect()
  }

  private suspend fun downloadInputFiles() {
    // Get the list of assignments for which the input file has to be downloaded
    val worker = authManager.fetchLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val filteredAssignments =
      assignmentRepository
        .getIncompleteAssignments()
        .filter(
          fun(assignment): Boolean {
            val microtask = microTaskRepository.getById(assignment.microtask_id)
            // If the microtask has no input file id then no need to download
            if (microtask.input_file_id == null) return false
            // If the file is already downloaded, then no need to download
            val path = microtaskInputContainer.getBlobPath(assignment.microtask_id)
            return !File(path).exists()
          }
        )

    // Download each file
    var count = 0
    for (assignment in filteredAssignments) {
      assignmentRepository
        .getInputFile(worker.idToken, assignment.id) // TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
//        .catch { _dashboardUiState.value = DashboardUiState.Error(it) }
        .collect { response ->
          FileUtils.downloadFileToLocalPath(
            response,
            microtaskInputContainer.getBlobPath(assignment.microtask_id)
          )
        }
      count += 1
      val localProgress = (count * 25) / filteredAssignments.size + MAX_RECEIVE_DB_UPDATES_PROGRESS
      setProgressAsync(Data.Builder().putInt("progress", localProgress).build())
    }
  }

  private suspend fun fetchVerifiedAssignments(from: String = "") {
    val worker = authManager.fetchLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val from = assignmentRepository.getNewVerifiedAssignmentsFromTime(worker.id)

    assignmentRepository // TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .getVerifiedAssignments(worker.idToken, from)
//      .catch { _dashboardUiState.value = DashboardUiState.Error(it) }
      .collect()
  }

  /**
   * Remove karya files that are already uploaded to the server. Remove input files of submitted
   * microtasks
   */
  private suspend fun cleanupKaryaFiles() {
    // Get all assignments whose output karya files are uploaded to the server
    val uploadedAssignments = assignmentRepository.getAssignmentsWithUploadedFiles()

    // Output directory
    val directory = microtaskOutputContainer.getDirectory()
    val files = File(directory).listFiles()!!

    // Delete all files for these assignments
    for (assignment in uploadedAssignments) {
      val assignmentOutputFiles = try {
        val outputFilesDict = assignment.output.asJsonObject.getAsJsonObject("files")
        val outputFiles = arrayListOf<String>()
        outputFilesDict.keySet().forEach { k -> outputFiles.add(outputFilesDict.get(k).asString) }
        outputFiles
      } catch (e: Exception) {
        arrayListOf<String>()
      }
      val assignmentFiles =
        files.filter {
          !(assignmentOutputFiles.contains(it.name)) && (it.name.startsWith("${assignment.id}-") || it.name.startsWith(
            "${assignment.id}."
          ))
        }
      assignmentFiles.forEach { if (it.exists()) it.delete() }
    }

    // Get all submitted microtask input files
    val microtaskIds = microTaskRepository.getSubmittedMicrotasksWithInputFiles()
    for (id in microtaskIds) {
      // input tarball
      val tarBallPath = microtaskOutputContainer.getBlobPath(id)
      val tarBall = File(tarBallPath)
      if (tarBall.exists()) {
        tarBall.delete()
      }

      // input folder
      val microtaskInputDirectory = microtaskInputContainer.getDirectory(id)
      Log.d("MICRTSK_INPUT_DIRECTORY", microtaskInputDirectory)
      val microtaskDirectory = File(microtaskInputDirectory)
      for (file in microtaskDirectory.listFiles()!!) {
        file.delete()
      }
      microtaskDirectory.delete()
    }
  }

  /** Upload the tarball of an assignment to the server */
  private suspend fun uploadTarBall(
    assignment: MicroTaskAssignmentRecord,
    assignmentTarBallPath: String,
    tarBallName: String,
  ) {
    val worker = authManager.fetchLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val requestFile =
      RequestBody.create("application/tgz".toMediaTypeOrNull(), File(assignmentTarBallPath))
    val filePart = MultipartBody.Part.createFormData("file", tarBallName, requestFile)

    val md5sum = FileUtils.getMD5Digest(assignmentTarBallPath)
    val uploadFileRequest =
      UploadFileRequest(
        microtaskOutputContainer.cname,
        tarBallName,
        ChecksumAlgorithm.MD5.toString(),
        md5sum
      )

    val dataPart = MultipartBody.Part.createFormData("data", Gson().toJson(uploadFileRequest))

    // Send the tarball
    assignmentRepository //TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .submitAssignmentOutputFile(worker.idToken, assignment.id, dataPart, filePart)
      .collect { fileRecord -> // Because we want this to be synchronous
        karyaFileRepository.insertKaryaFile(fileRecord)
        assignmentRepository.updateOutputFileId(assignment.id, fileRecord.id)
      }
  }

}
