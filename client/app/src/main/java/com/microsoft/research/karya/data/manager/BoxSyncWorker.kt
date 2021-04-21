package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.appcompat.app.AppCompatActivity
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonArray
import com.google.gson.JsonObject
import com.microsoft.research.karya.data.model.karya.ChecksumAlgorithm
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.model.karya.LanguageRecord
import com.microsoft.research.karya.data.model.karya.LanguageResourceRecord
import com.microsoft.research.karya.data.model.karya.LanguageResourceValueRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskGroupAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskGroupRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskRecord
import com.microsoft.research.karya.data.model.karya.PolicyRecord
import com.microsoft.research.karya.data.model.karya.ScenarioRecord
import com.microsoft.research.karya.data.model.karya.TaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.remote.request.UploadFileRequest
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.ui.dashboard.AType
import com.microsoft.research.karya.utils.FileUtils
import com.microsoft.research.karya.utils.jtar.TarEntry
import com.microsoft.research.karya.utils.jtar.TarOutputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.math.BigInteger
import java.security.MessageDigest
import java.util.zip.GZIPOutputStream
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody

// Worker Class for backgrounding sync with box
class BoxSyncWorker(context: Context, workerParams: WorkerParameters) :
    CoroutineWorker(context, workerParams) {

  companion object {
    const val WORK_NAME: String = "BOX_SYNC"

    /** Constants for syncbox progress */
    private const val PROGRESS_UNIT = 25
    private const val UPLOAD_FILES_BEGIN = 0
    private const val UPLOAD_FILES_END = UPLOAD_FILES_BEGIN + PROGRESS_UNIT
    private const val SEND_UPDATES_BEGIN = UPLOAD_FILES_END
    private const val SEND_UPDATES_END = SEND_UPDATES_BEGIN + PROGRESS_UNIT
    private const val RECEIVE_UPDATES_BEGIN = SEND_UPDATES_END
    private const val RECEIVE_UPDATES_END = RECEIVE_UPDATES_BEGIN + PROGRESS_UNIT
    private const val DOWNLOAD_FILES_BEGIN = RECEIVE_UPDATES_END
    private const val DOWNLOAD_FILES_END = DOWNLOAD_FILES_BEGIN + PROGRESS_UNIT
  }

  // Do not change the ordering of this enum since we rely on it's ordinal.
  enum class Progress {
    UPLOADING_FILES,
    SENDING_UPDATES,
    RECEIVING_UPDATES,
    DOWNLOADING_FILES,
    SYNC_FINISHED,
  }

  val karyaDb: KaryaDatabase = KaryaDatabase.getInstance(applicationContext)!!
  var uiScope = CoroutineScope(Dispatchers.Main)
  var ioScope = CoroutineScope(Dispatchers.IO)
  var karyaAPI = RetrofitFactory.create()
  lateinit var thisWorker: WorkerRecord
  var appLanguageId = inputData.getInt("appLanguageId", -1) // -1 case should never happen

  private val _progress = MutableStateFlow(0)
  val progress = _progress.asStateFlow()

  private val _progressStage = MutableStateFlow(Progress.UPLOADING_FILES)
  val progressStage = _progress.asStateFlow()

  private fun setWorker() {
    var setWorkerJob =
        ioScope.launch {
          val workers = karyaDb.workerDao().getAll()
          if (workers.isNotEmpty()) thisWorker = workers[0]
        }
  }

  private suspend fun updateProgressStage(progressStage: Progress) =
      withContext(Dispatchers.IO) { _progressStage.emit(progressStage) }

  private suspend fun updateProgress(int: Int) {
    val currentProgress = _progressStage.value
    _progress.emit(currentProgress.ordinal)
  }

  override suspend fun doWork(): Result {

    //        uiScope.launch {
    //            syncProgressBar.max = DOWNLOAD_FILES_END
    //            syncProgressBar.progress = 0
    //        }

    // Execute various sync stages
    //            uiScope.launch { networkRequestMessageTv.text = uploadFilesString }
    //        updateText(DashboardActivity.uploadFilesString)

    setWorker()
    uploadFilesToBox() // Only files are uploaded which are created by the user for each assignment
    //        updateText(DashboardActivity.sendUpdatesString)
    //            uiScope.launch { networkRequestMessageTv.text = sendUpdatesString }
    sendDbUpdates() // Only database updates are sent
    //        updateText(DashboardActivity.receiveUpdatesString)
    //            uiScope.launch { networkRequestMessageTv.text = receiveUpdatesString }
    receiveDbUpdates() //
    //        updateText(DashboardActivity.downloadFilesString)
    //            uiScope.launch { networkRequestMessageTv.text = downloadFilesString }
    downloadFilesFromBox()

    return Result.success()
  }

  private suspend fun uploadFilesToBox() {
    val filteredAssignments =
        karyaDb.microtaskAssignmentDaoExtra().getCompletedAssignments().filter {
          // output_file_id is the id of the file in the blob storage(cloud) and will be non-empty
          // if the file was already uploaded
          it.output_file_id == null && it.output.get("files").asJsonArray.size() > 0
        }

    val totalFiles = filteredAssignments.size
    updateUploadedFilesStatus(0, totalFiles)

    for ((index, assignment) in filteredAssignments.withIndex()) {
      createTarBall(assignment)
      uploadTarBall(assignment)
      updateUploadedFilesStatus(index + 1, totalFiles)
    }
  }

  /** Create the tar ball of all the output files for a particular assignment. */
  private fun createTarBall(assignment: MicrotaskAssignmentRecord) {
    val tarPath = getAssignmentTarBallPath(assignment)

    val fileStream = FileOutputStream(tarPath)
    val gzipStream = GZIPOutputStream(fileStream)
    val tarStream = TarOutputStream(BufferedOutputStream(gzipStream))

    val files = assignment.output.get("files").asJsonArray
    for (file in files) {
      val assignmentOutputFileName = file.asString
      val assignmentOutputFilepath = getAssignmentOutputFilePath(assignmentOutputFileName)
      val assignmentOutputFile = File(assignmentOutputFilepath)

      // Update the tar header
      tarStream.putNextEntry(TarEntry(assignmentOutputFile, assignmentOutputFileName))

      // Write the file
      val inputStream = FileInputStream(assignmentOutputFile)
      inputStream.copyTo(tarStream)
      inputStream.close()
    }

    tarStream.close()
    gzipStream.close()
    fileStream.close()
  }

  /** Upload the tar ball for a particular assignment */
  private suspend fun uploadTarBall(assignment: MicrotaskAssignmentRecord) {
    var container = BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT
    val tarBallName = container.getBlobName(assignment.id)
    //        val tarBallName =
    // getBlobName(BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT, assignment.id)
    val tarBallPath = getAssignmentTarBallPath(assignment)

    val requestFile = RequestBody.create(MediaType.parse("application/tgz"), File(tarBallPath))

    val filePart = MultipartBody.Part.createFormData("file", tarBallName, requestFile)

    // Create data part
    val md5sum = getMD5Digest(tarBallPath)
    val uploadFileRequest =
        UploadFileRequest(
            thisWorker.box_id,
            BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT.cname,
            tarBallName,
            ChecksumAlgorithm.md5.toString(),
            md5sum)

    val dataPart = MultipartBody.Part.createFormData("data", Gson().toJson(uploadFileRequest))

    // Make the call
    val call =
        karyaAPI.postUploads(
            thisWorker.auth_provider!!.toString(),
            thisWorker.id_token!!,
            assignment.id,
            dataPart,
            filePart)
    val response = call.execute()

    // If successful request, insert the file and update the assignment output file ID
    // in the server. Create a file record in karya_fie database and update the output file id in
    // microtask_assignment table
    if (response.isSuccessful) {
      val fileRecord: KaryaFileRecord = response.body()!!
      karyaDb.karyaFileDao().insert(fileRecord)
      karyaDb.microtaskAssignmentDaoExtra().updateOutputFileID(assignment.id, fileRecord.id)
    } else {
      throw Exception("Failed to upload")
    }
  }

  /** Update progress bar after file upload // */
  private fun updateUploadedFilesStatus(uploaded: Int, total: Int) =
      uiScope.launch {
        if (total == 0 || total == uploaded) {
          updateProgress(UPLOAD_FILES_END)
        } else {
          updateProgress(UPLOAD_FILES_BEGIN + (uploaded * PROGRESS_UNIT) / total)
        }
      }

  /** Send database updates to the Db */
  private suspend fun sendDbUpdates() {
    // Db update stages
    val currentTime = BaseActivity.getCurrentDate()
    updateSendStageProgress(SendUpdatesStage.SEND_START)

    // 1. Collect microtask assignment updates
    val microtaskAssignmentUpdates =
        karyaDb.microtaskAssignmentDaoExtra().getCompletedAssignments().filter {
          it.output.get("files").asJsonArray.size() == 0 || it.output_file_id != null
        }
    updateSendStageProgress(SendUpdatesStage.COLLECTED_MA_UPDATES)

    // 2. Collect microtask group assignment updates
    val microtaskGroupAssignmentUpdates =
        karyaDb.microtaskGroupAssignmentDaoExtra().getCompletedGroupAssignments()
    updateSendStageProgress(SendUpdatesStage.COLLECTED_MGA_UPDATES)

    // 4. Put together updates JSON object

    val updates = JsonArray()
    if (microtaskAssignmentUpdates.isNotEmpty()) {
      val update = JsonObject()
      update.addProperty("tableName", "microtask_assignment")
      update.add("rows", Gson().toJsonTree(microtaskAssignmentUpdates))
      updates.add(update)
    }
    if (microtaskGroupAssignmentUpdates.isNotEmpty()) {
      val update = JsonObject()
      update.addProperty("tableName", "microtask_group_assignment")
      update.add("rows", Gson().toJsonTree(microtaskGroupAssignmentUpdates))
      updates.add(update)
    }

    // Check if this worker was updated since last update
    if (thisWorker.last_updated_at > thisWorker.last_sent_to_box_at) {
      val workerUpdates: List<WorkerRecord> = arrayListOf(thisWorker)
      val update = JsonObject()
      update.addProperty("tableName", "worker")
      update.add("rows", Gson().toJsonTree(workerUpdates))
      updates.add(update)
    }
    updateSendStageProgress(SendUpdatesStage.PREPARED_UPDATE_OBJECT)

    // 5. Send updates to server
    val postUpdates =
        karyaAPI.postUpdates(thisWorker.auth_provider!!.toString(), thisWorker.id_token!!, updates)
    val response = postUpdates.execute()
    updateSendStageProgress(SendUpdatesStage.SENT_REQUEST)

    // 6. Update local db: microtask (group) assignment updates to "submitted" state
    if (response.isSuccessful) {
      // Mark microtask assignments as submitted
      microtaskAssignmentUpdates.forEach {
        karyaDb.microtaskAssignmentDaoExtra().markSubmitted(it.id)
      }

      // Mark microtask group assignments as submitted
      microtaskGroupAssignmentUpdates.forEach {
        karyaDb.microtaskGroupAssignmentDaoExtra().markSubmitted(it.id)
      }

      // Update last sent time
      karyaDb.workerDaoExtra().updateLastSentToBoxAt(currentTime)
      updateSendStageProgress(SendUpdatesStage.UPDATED_LOCAL_DB)
    } else {
      throw Exception("Failed to send updates")
    }
  }

  /** Update progress bar for send stage */
  private fun updateSendStageProgress(state: SendUpdatesStage) =
      uiScope.launch {
        val total = SendUpdatesStage.SEND_END.ordinal - 1
        val progress = state.ordinal
        updateProgress(SEND_UPDATES_BEGIN + (progress * PROGRESS_UNIT) / total)
      }

  /** Receive database updates frm the Db */
  private suspend fun receiveDbUpdates() {
    val currentTime = BaseActivity.getCurrentDate()
    updateReceiveStageProgress(ReceiveUpdatesStage.RECEIVE_START)

    // Call for updates
    val request =
        karyaAPI.getUpdates(thisWorker.auth_provider.toString(), thisWorker.id_token!!, thisWorker)
    val response = request.execute()
    updateReceiveStageProgress(ReceiveUpdatesStage.RECEIVED_UPDATES)

    // If success response, then update the database
    if (response.isSuccessful) {
      val updates = response.body()!!.asJsonArray
      applyUpdates(updates)
    } else {
      throw Exception("Failed to receive updates")
    }

    karyaDb.workerDaoExtra().updateLastReceivedFromBox(thisWorker.id, currentTime)
    updateReceiveStageProgress(ReceiveUpdatesStage.UPDATED_LOCAL_DB)

    // Remove unnecessary karya files
    try {
      cleanupKaryaFiles()
    } catch (e: Exception) {
      // ignore exception for now
    }
    updateReceiveStageProgress(ReceiveUpdatesStage.CLEANUP_KARYA_FILES)
  }

  /** Apply updates from the server to the local DB */
  private suspend fun applyUpdates(updates: JsonArray) {
    val gson = GsonBuilder().serializeNulls().create()

    for (updateEntry in updates) {
      val update = updateEntry.asJsonObject
      val tableName = update.get("tableName").asString
      val rows = update.get("rows").asJsonArray

      when (tableName) {
        "language" -> {
          val listType = object : AType<LanguageRecord>() {}.type
          val languages: ArrayList<LanguageRecord> = gson.fromJson(rows, listType)
          karyaDb.languageDao().upsert(languages)
        }
        "scenario" -> {
          val listType = object : AType<ScenarioRecord>() {}.type
          val scenarios: ArrayList<ScenarioRecord> = gson.fromJson(rows, listType)
          karyaDb.scenarioDao().upsert(scenarios)
        }
        "policy" -> {
          val listType = object : AType<PolicyRecord>() {}.type
          val policies: ArrayList<PolicyRecord> = gson.fromJson(rows, listType)
          karyaDb.policyDao().upsert(policies)
        }
        "language_resource" -> {
          val listType = object : AType<LanguageResourceRecord>() {}.type
          val languageResources: ArrayList<LanguageResourceRecord> = gson.fromJson(rows, listType)
          karyaDb.languageResourceDao().upsert(languageResources)
        }
        "language_resource_value" -> {
          val listType = object : AType<LanguageResourceValueRecord>() {}.type
          val languageResourceValues: ArrayList<LanguageResourceValueRecord> =
              gson.fromJson(rows, listType)
          karyaDb.languageResourceValueDao().upsert(languageResourceValues)
        }
        "task" -> {
          val listType = object : AType<TaskRecord>() {}.type
          val tasks: ArrayList<TaskRecord> = gson.fromJson(rows, listType)
          karyaDb.taskDao().upsert(tasks)
        }
        "task_assignment" -> {
          val listType = object : AType<TaskAssignmentRecord>() {}.type
          val taskAssignments: ArrayList<TaskAssignmentRecord> = gson.fromJson(rows, listType)
          karyaDb.taskAssignmentDao().upsert(taskAssignments)
        }
        "microtask_group" -> {
          val listType = object : AType<MicrotaskGroupRecord>() {}.type
          val microtaskGroups: ArrayList<MicrotaskGroupRecord> = gson.fromJson(rows, listType)
          karyaDb.microtaskGroupDao().upsert(microtaskGroups)
        }
        "microtask" -> {
          val listType = object : AType<MicrotaskRecord>() {}.type
          val microtasks: ArrayList<MicrotaskRecord> = gson.fromJson(rows, listType)
          karyaDb.microTaskDao().upsert(microtasks)
        }
        "microtask_group_assignment" -> {
          val listType = object : AType<MicrotaskGroupAssignmentRecord>() {}.type
          val microtaskGroupAssignments: ArrayList<MicrotaskGroupAssignmentRecord> =
              gson.fromJson(rows, listType)
          karyaDb.microtaskGroupAssignmentDao().upsert(microtaskGroupAssignments)
        }
        "microtask_assignment" -> {
          val listType = object : AType<MicrotaskAssignmentRecord>() {}.type
          val microtaskAssignments: ArrayList<MicrotaskAssignmentRecord> =
              gson.fromJson(rows, listType)
          karyaDb.microtaskAssignmentDao().upsert(microtaskAssignments)
        }
        "worker" -> {
          val listType = object : AType<WorkerRecord>() {}.type
          val workers: ArrayList<WorkerRecord> = gson.fromJson(rows, listType)
          karyaDb.workerDao().upsert(workers)
        }
        "karya_file" -> {
          val listType = object : AType<KaryaFileRecord>() {}.type
          val karyaFiles: ArrayList<KaryaFileRecord> = gson.fromJson(rows, listType)
          karyaDb.karyaFileDao().upsert(karyaFiles)
        }
      }
    }
  }

  /**
   * Remove karya files that are already uploaded to the server. Remove input files of submitted
   * microtasks
   */
  private suspend fun cleanupKaryaFiles() {
    // Get all assignments whose output karya files are uploaded to the server
    val uploadedAssignments =
        karyaDb.microtaskAssignmentDaoExtra().getAssignmentsWithUploadedFiles()

    // Output directory
    val directory = getAssignmentOutputDirectoryPath()
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
    val microtaskIds = karyaDb.microtaskDaoExtra().getSubmittedMicrotasksWithInputFiles()
    for (id in microtaskIds) {
      // input tarball
      val tarBallPath = getBlobPath(BaseActivity.KaryaFileContainer.MICROTASK_INPUT, id)
      val tarBall = File(tarBallPath)
      if (tarBall.exists()) {
        tarBall.delete()
      }

      // input folder
      val microtaskInputName = BaseActivity.KaryaFileContainer.MICROTASK_INPUT.cname
      val microtaskDirectory =
          applicationContext.getDir("${microtaskInputName}_$id", AppCompatActivity.MODE_PRIVATE)
      for (file in microtaskDirectory.listFiles()!!) {
        file.delete()
      }
      microtaskDirectory.delete()
    }
  }

  fun getBlobPath(container: BaseActivity.KaryaFileContainer, vararg params: String): String {
    val dir = getContainerDirectory(container)
    val name = getBlobName(container, *params)
    return "$dir/$name"
  }

  fun getBlobName(container: BaseActivity.KaryaFileContainer, vararg params: String): String {
    return container.getBlobName(*params)
  }

  fun getContainerDirectory(container: BaseActivity.KaryaFileContainer): String {
    return container.getDirectory(applicationContext)
  }

  /** Update progress bar after receive stage */
  private fun updateReceiveStageProgress(state: ReceiveUpdatesStage) =
      uiScope.launch {
        val total = ReceiveUpdatesStage.RECEIVE_END.ordinal - 1
        val progress = state.ordinal
        updateProgress(RECEIVE_UPDATES_BEGIN + (progress * PROGRESS_UNIT) / total)
      }

  /** Download updated file language resources and assignment input files from box */
  private suspend fun downloadFilesFromBox() {
    // If the file language resource is updated, download and extract it
    val languageRecord = karyaDb.languageDao().getById(appLanguageId)

    /** The following check depends on [thisWorker] not being updated by previous stages */
    if (languageRecord.lrv_file_id != null &&
        languageRecord.last_updated_at > thisWorker.last_received_from_server_at) {
      val languageResourceFileResponse =
          karyaAPI.getFileLanguageResourceValuesByLanguageId(appLanguageId)
      if (languageResourceFileResponse.isSuccessful) {
        // The filepath is storing tar file
        val filePath = getBlobPath(BaseActivity.KaryaFileContainer.L_LRVS, appLanguageId.toString())
        FileUtils.downloadFileToLocalPath(languageResourceFileResponse, filePath)

        /** Extract the tar ball into the lang-res folder */
        val langResDir = getContainerDirectory(BaseActivity.KaryaFileContainer.LANG_RES)
        FileUtils.extractTarBallIntoDirectory(filePath, langResDir)
      }
    }

    // Get the list of assignments for which the input file has to be downloaded
    val filteredAssignments =
        karyaDb
            .microtaskAssignmentDaoExtra()
            .getIncompleteAssignments()
            .filter(
                fun(assignment): Boolean {
                  // get microtask for assignment
                  val microtask = karyaDb.microTaskDao().getById(assignment.microtask_id)
                  // If the microtask has no input file id then no need to download
                  if (microtask.input_file_id == null) return false

                  // If the file is already downloaded, then no need to download
                  val path = getMicrotaskInputTarBallPath(assignment)
                  return !File(path).exists()
                })

    val totalFiles = filteredAssignments.size
    updateDownloadedFilesStatus(0, totalFiles)

    // Download each file
    for ((index, assignment) in filteredAssignments.withIndex()) {
      downloadFileForAssignment(assignment)
      updateDownloadedFilesStatus(index, totalFiles)
    }
  }

  /** Download input file for a microtask assignment */
  private suspend fun downloadFileForAssignment(assignment: MicrotaskAssignmentRecord) {
    // Generate the call
    val response =
        karyaAPI.getInputFileForAssignment(
            thisWorker.auth_provider.toString(), thisWorker.id_token!!, assignment.id)

    if (response.isSuccessful) {
      /** Stream response to the local file */
      val localFilePath = getMicrotaskInputTarBallPath(assignment)
      FileUtils.downloadFileToLocalPath(response, localFilePath)
    } else {
      throw Exception("Failed to download file")
    }
  }

  /** Update progress after file download */
  private fun updateDownloadedFilesStatus(downloaded: Int, total: Int) =
      uiScope.launch {
        if (total == 0 || total == downloaded) {
          updateProgress(DOWNLOAD_FILES_END)
        } else {
          updateProgress(DOWNLOAD_FILES_BEGIN + (downloaded * PROGRESS_UNIT) / total)
        }
      }

  /** Get the directory path for the assignment output files */
  private fun getAssignmentOutputDirectoryPath(): String {
    var container = BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT
    return container.getDirectory(applicationContext)
    //        return
    // getContainerDirectory(BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT)
  }

  /** Get the path for the assignment output tar ball */
  private fun getAssignmentTarBallPath(assignment: MicrotaskAssignmentRecord): String {
    return getBlobPath(BaseActivity.KaryaFileContainer.MICROTASK_ASSIGNMENT_OUTPUT, assignment.id)
  }

  /** Get the path for an assignment output file */
  private fun getAssignmentOutputFilePath(fileName: String): String {
    val dir = getAssignmentOutputDirectoryPath()
    return "$dir/$fileName"
  }

  /** Get microtask input tarball path */
  private fun getMicrotaskInputTarBallPath(assignment: MicrotaskAssignmentRecord): String {
    return getBlobPath(BaseActivity.KaryaFileContainer.MICROTASK_INPUT, assignment.microtask_id)
  }

  /** Get the MD5 digest for a file */
  private fun getMD5Digest(filePath: String): String {
    val digest = MessageDigest.getInstance("MD5")
    val inputStream = FileInputStream(filePath)

    val buffer = ByteArray(8192)
    var readBytes: Int
    while (inputStream.read(buffer).also { readBytes = it } > 0) {
      digest.update(buffer, 0, readBytes)
    }
    val md5sum: ByteArray = digest.digest()
    val bigInt = BigInteger(1, md5sum)
    val output = bigInt.toString(16)

    // Fill to 32 chars
    return "%32s".format(output).replace(' ', '0')
  }
}

private enum class SendUpdatesStage {
  SEND_START,
  COLLECTED_MA_UPDATES,
  COLLECTED_MGA_UPDATES,
  PREPARED_UPDATE_OBJECT,
  SENT_REQUEST,
  UPDATED_LOCAL_DB,
  SEND_END,
}

private enum class ReceiveUpdatesStage {
  RECEIVE_START,
  RECEIVED_UPDATES,
  UPDATED_LOCAL_DB,
  CLEANUP_KARYA_FILES,
  RECEIVE_END
}
