package com.microsoft.research.karya.ui.dashboard

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ChecksumAlgorithm
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.remote.request.UploadFileRequest
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.MicrotaskAssignmentOutput
import com.microsoft.research.karya.utils.MicrotaskInput
import com.microsoft.research.karya.utils.extensions.getBlobPath
import kotlinx.coroutines.flow.collect
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import java.io.File

class DashboardSyncWorker(
  appContext: Context,
  workerParams: WorkerParameters,
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
  private val karyaFileRepository: KaryaFileRepository,
  private val microTaskRepository: MicroTaskRepository,
  @FilesDir private val fileDirPath: String,
  private val authManager: AuthManager,
) : CoroutineWorker(appContext, workerParams) {

  private val microtaskOutputContainer = MicrotaskAssignmentOutput(fileDirPath)
  private val microtaskInputContainer = MicrotaskInput(fileDirPath)

  override suspend fun doWork(): Result {

    return try {

      syncWithServer()

      Result.success()
    } catch (e: Exception) {
//      if (runAttemptCount < MAX_NUMBER_OF_RETRY) {
//        Result.retry()
//      } else {
//        Result.failure()
//      }
      Result.failure()
    }
  }

  suspend fun syncWithServer() {
//      _dashboardUiState.value = DashboardUiState.Loading

    submitCompletedAssignments()
    setProgressAsync(Data.Builder().putInt("progress", 25).build())
    fetchNewAssignments()
    setProgressAsync(Data.Builder().putInt("progress", 50).build())
    fetchVerifiedAssignments()
    setProgressAsync(Data.Builder().putInt("progress", 75).build())
    cleanupKaryaFiles()

    // TODO: Include the UI update hack here ?

//      _dashboardUiState.value = DashboardUiState.Success(DashboardStateSuccess(taskInfoList, totalCreditsEarned))
  }

  private suspend fun submitCompletedAssignments() {
    uploadOutputFiles()
    sendDbUpdates()
  }

  private suspend fun fetchNewAssignments() {
    receiveDbUpdates()
    downloadInputFiles()
  }

  /** Upload the Files of completed Assignments */
  private suspend fun uploadOutputFiles() {
    val updates = assignmentRepository.getLocalCompletedAssignments()

    val filteredAssignments =
      updates.filter {
        // output_file_id is the id of the file in the blob storage(cloud) and will be non-empty if
        // the file was already uploaded
        it.output_file_id == null && !it.output.isJsonNull && it.output.asJsonObject.get("files").asJsonArray.size() > 0
      }

    for (assignment in filteredAssignments) {
      val assignmentTarBallPath = microtaskOutputContainer.getBlobPath(assignment.id)
      val tarBallName = microtaskOutputContainer.getBlobName(assignment.id)
      val outputDir = microtaskOutputContainer.getDirectory()
      val fileNames = assignment.output.asJsonObject.get("files").asJsonArray.map { it.asString }
      val outputFilePaths = fileNames.map { "$outputDir/${it}" }
      FileUtils.createTarBall(assignmentTarBallPath, outputFilePaths, fileNames)
      uploadTarBall(assignment, assignmentTarBallPath, tarBallName)
    }
  }

  private suspend fun sendDbUpdates() {
    val worker = authManager.fetchLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val microtaskAssignments =
      assignmentRepository.getLocalCompletedAssignments().filter {
        it.output.isJsonNull || it.output.asJsonObject.get("files").asJsonArray.size() == 0 || it.output_file_id != null
      }
    assignmentRepository //TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .submitAssignments(worker.idToken, microtaskAssignments)
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
      val assignmentFiles =
        files.filter { it.name.startsWith("${assignment.id}-") || it.name.startsWith("${assignment.id}.") }
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