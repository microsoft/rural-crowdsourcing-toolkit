package com.microsoft.research.karya.ui.dashboard

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters
import com.google.firebase.crashlytics.FirebaseCrashlytics
import com.google.gson.Gson
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ChecksumAlgorithm
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.remote.request.UploadFileRequest
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.injection.qualifier.FilesDir
import com.microsoft.research.karya.utils.DateUtils
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.MicrotaskAssignmentOutput
import com.microsoft.research.karya.utils.MicrotaskInput
import com.microsoft.research.karya.utils.extensions.getBlobPath
import kotlinx.coroutines.flow.collect
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File
import java.lang.Error

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
  private val paymentRepository: PaymentRepository,
  private val workerRepository: WorkerRepository,
  @FilesDir private val fileDirPath: String,
  private val authManager: AuthManager,
) : CoroutineWorker(appContext, workerParams) {

  private val microtaskOutputContainer = MicrotaskAssignmentOutput(fileDirPath)
  private val microtaskInputContainer = MicrotaskInput(fileDirPath)

  private var warningMsg: String? = null

  /**
   * Work function. Sync with server. Set warning or error messages as necessary.
   */
  override suspend fun doWork(): Result {
    return try {
      syncWithServer()
      Result.success(Data.Builder().putString("warningMsg", warningMsg).build())
    } catch (e: Exception) {
      Result.failure(Data.Builder().putString("errorMsg", e.message).build())
    }
  }

  private suspend fun syncWithServer() {
    // Update expired assignments before syncing
    try {
      val worker = authManager.getLoggedInWorker()
      assignmentRepository.updateExpired(worker.id)
    } catch(e: Exception) {
      FirebaseCrashlytics.getInstance().recordException(e)
    }

    // Upload all files
    try {
      uploadOutputFiles()
    } catch (e: Exception) {
      FirebaseCrashlytics.getInstance().recordException(e)
      throw Exception(applicationContext.getString(R.string.upload_file_error))
    }
    setProgressAsync(Data.Builder().putInt("progress", MAX_UPLOAD_PROGRESS).build())

    // Send db updates
    try {
      sendDbUpdates()
    } catch (e: Exception) {
      FirebaseCrashlytics.getInstance().recordException(e)
      throw Exception(applicationContext.getString(R.string.send_db_error))
    }
    setProgressAsync(Data.Builder().putInt("progress", MAX_SEND_DB_UPDATES_PROGRESS).build())

    // Receive db updates
    try {
      receiveDbUpdates()
    } catch (e: Exception) {
      FirebaseCrashlytics.getInstance().recordException(e)
      throw Exception(applicationContext.getString(R.string.receive_db_error))
    }
    setProgressAsync(Data.Builder().putInt("progress", MAX_RECEIVE_DB_UPDATES_PROGRESS).build())

    // Download input files
    try {
      downloadInputFiles()
    } catch (e: Exception) {
      FirebaseCrashlytics.getInstance().recordException(e)
      throw Exception(applicationContext.getString(R.string.download_file_error))
    }
    setProgressAsync(Data.Builder().putInt("progress", MAX_DOWNLOAD_PROGRESS).build())

    // Get verified assignments
    try {
      fetchVerifiedAssignments()
    } catch (e: Exception) {
      FirebaseCrashlytics.getInstance().recordException(e)
      throw Exception(applicationContext.getString(R.string.received_verified_error))
    }
    setProgressAsync(Data.Builder().putInt("progress", MAX_FETCH_VERIFIED_PROGRESS).build())

    // Clean up karya files. This should never result in an error
    cleanupKaryaFiles()
    setProgressAsync(Data.Builder().putInt("progress", MAX_CLEANUP_PROGRESS).build())
  }

  /** Upload the files of completed assignments */
  private suspend fun uploadOutputFiles() {
    val updates = assignmentRepository.getLocalCompletedAssignments()

    // Filter all completed assignments whose files have not been uploaded
    val filteredAssignments =
      updates.filter {
        // output_file_id is the id of the file in the box db and will be non-empty if
        // the file was already uploaded
        it.output_file_id == null && !it.output.isJsonNull && it.output.asJsonObject.get("files").asJsonObject.size() > 0
      }

    // Create the output tar ball for each assignment and upload them
    var count = 0
    for (assignment in filteredAssignments) {
      // Generate output blob name and path
      val assignmentTarBallPath = microtaskOutputContainer.getBlobPath(assignment.id)
      val tarBallName = microtaskOutputContainer.getBlobName(assignment.id)
      val outputDir = microtaskOutputContainer.getDirectory()

      // Get the list of output files
      val outputFiles = assignment.output.asJsonObject.get("files").asJsonObject
      val fileNames = outputFiles.keySet().map { outputFiles.get(it).asString }
      val outputFilePaths = fileNames.map { "$outputDir/${it}" }

      // Check if all the output files exists. Mark assignment as assigned even if one of the output files does not exist
      var allFilesExist = true
      for (path in outputFilePaths) {
        if (!File(path).exists()) {
          assignmentRepository.markAssigned(assignment.id, DateUtils.getCurrentDate())
          warningMsg = applicationContext.getString(R.string.reset_assignment_warning)
          allFilesExist = false
          break
        }
      }

      // If all output files are not present, move to the next assignment
      if (!allFilesExist) continue

      // Create and upload the tar ball
      FileUtils.createTarBall(assignmentTarBallPath, outputFilePaths, fileNames)
      uploadTarBall(assignment, assignmentTarBallPath, tarBallName)

      // Update progress
      count += 1
      val localProgress = (count * MAX_UPLOAD_PROGRESS) / filteredAssignments.size
      setProgressAsync(Data.Builder().putInt("progress", localProgress).build())
    }
  }

  /**
   * Send all database updates
   */
  private suspend fun sendDbUpdates() {
    val worker = authManager.getLoggedInWorker()
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
      .collect { assignmentIds ->
        assignmentRepository.markMicrotaskAssignmentsSubmitted(
          assignmentIds
        )
      }

    // Get skipped assignments from the database
    var skippedAssignments = assignmentRepository.getLocalSkippedAssignments()
    skippedAssignments = skippedAssignments + assignmentRepository.getLocalExpiredAssignments()
    // Submit the skipped assignments
    assignmentRepository //TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .submitSkippedAssignments(worker.idToken, skippedAssignments)
      .collect {}
  }

  /**
   * Receive db updates
   */
  private suspend fun receiveDbUpdates() {
    val worker = authManager.getLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val from = assignmentRepository.getNewAssignmentsFromTime(worker.id)

    // Get Assignment DB updates
    assignmentRepository //TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .getNewAssignments(worker.idToken, from)
      .collect()

    // Get Worker Balance
    try {
        paymentRepository.refreshWorkerEarnings(worker.idToken).collect()
    } catch (e: Error) {
      FirebaseCrashlytics.getInstance().recordException(e)
      warningMsg = "Cannot update payment information"
    }
    // Get Leaderboard data
    workerRepository
      .updateLeaderboard(worker.idToken)
      .collect()
  }

  /**
   * Download input files
   */
  private suspend fun downloadInputFiles() {
    // Get the list of assignments for which the input file has to be downloaded
    val worker = authManager.getLoggedInWorker()
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
        .getInputFile(
          worker.idToken,
          assignment.id
        ) // TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
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

  /**
   * Get all verified assignments
   */
  private suspend fun fetchVerifiedAssignments() {
    val worker = authManager.getLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val from = assignmentRepository.getNewVerifiedAssignmentsFromTime(worker.id)

    assignmentRepository // TODO: IMPLEMENT .CATCH BEFORE .COLLECT AND SEND ERROR
      .getVerifiedAssignments(worker.idToken, from)
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
        files.filter {
          it.name.startsWith("${assignment.id}-") || it.name.startsWith("${assignment.id}.")
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
    val worker = authManager.getLoggedInWorker()
    checkNotNull(worker.idToken) { "Worker's idToken was null" }

    val requestFile =
      File(assignmentTarBallPath).asRequestBody("application/tgz".toMediaTypeOrNull())
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
