package com.microsoft.research.karya.ui.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.gson.Gson
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.ChecksumAlgorithm
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskStatus
import com.microsoft.research.karya.data.remote.request.UploadFileRequest
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.TaskRepository
import com.microsoft.research.karya.injection.qualifier.FilesDirQualifier
import com.microsoft.research.karya.utils.FileUtils.createTarBall
import com.microsoft.research.karya.utils.FileUtils.getMD5Digest
import com.microsoft.research.karya.utils.MICROTASK_ASSIGNMENT_OUTPUT
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.getBlobPath
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody
import java.io.File
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel
@Inject
constructor(
  private val taskRepository: TaskRepository,
  private val assignmentRepository: AssignmentRepository,
  private val karyaFileRepository: KaryaFileRepository,
  @FilesDirQualifier private val fileDirPath: String,
  private val authManager: AuthManager,
) : ViewModel() {

  val microtaskOutputContainer = MICROTASK_ASSIGNMENT_OUTPUT(fileDirPath)

  private val taskInfoComparator =
    compareByDescending<TaskInfo> { taskInfo -> taskInfo.taskStatus.completedMicrotasks }.thenBy { taskInfo ->
      taskInfo.taskID
    }

  private val _dashboardUiState: MutableStateFlow<DashboardUiState> =
    MutableStateFlow(DashboardUiState.Success(emptyList()))
  val dashboardUiState = _dashboardUiState.asStateFlow()

  suspend fun fetchNewTasks() {
    val idToken = authManager.fetchLoggedInWorkerIdToken()

    assignmentRepository.getAssignments(idToken, "new", "")
      .catch { it -> throw it }.collect()


    Log.d("SYNC_ORDER", "FETCH_FINISH")
  }

  suspend fun submitCompletedTasks() {
    uploadOutputFiles()
    sendDbUpdates()
    Log.d("SYNC_ORDER", "SUBMIT_FINISH")
  }

  private suspend fun sendDbUpdates() {

    viewModelScope.launch {

      val microtaskAssignments = assignmentRepository.getLocalCompletedAssignments().filter {
        it.output.get("files").asJsonArray.size() == 0 || it.output_file_id != null
      }
      assignmentRepository.submitAssignments(
        authManager.fetchLoggedInWorkerIdToken(),
        microtaskAssignments
      ).catch {
        throw it // TODO: Inform the UI if any error
      }.collect { assignmentIds ->
        assignmentRepository.markMicrotaskAssignmentsSubmitted(assignmentIds)
      }
    }
  }

  /**
   * Upload the Files of completed Assignments
   */
  private suspend fun uploadOutputFiles() {
    val updates = assignmentRepository.getLocalCompletedAssignments()

    val filteredAssignments = updates.filter {
      // output_file_id is the id of the file in the blob storage(cloud) and will be non-empty if the file was already uploaded
      it.output_file_id == null && it.output.get("files").asJsonArray.size() > 0
    }

    for (assignment in filteredAssignments) {
      val assignmentTarBallPath = getBlobPath(microtaskOutputContainer, assignment.id)
      val tarBallName = microtaskOutputContainer.getBlobName(assignment.id)
      val outputDir = microtaskOutputContainer.getDirectory()
      val fileNames = assignment.output.get("files").asJsonArray.map { it.asString }
      val outputFilePaths = fileNames.map {
        "$outputDir/${it}"
      }
      createTarBall(assignmentTarBallPath, outputFilePaths, fileNames)
      uploadTarBall(assignment, assignmentTarBallPath, tarBallName)
    }
  }

  /**
   * Upload the tarball of an assignment to the server
   */
  private suspend fun uploadTarBall(
    assignment: MicroTaskAssignmentRecord,
    assignmentTarBallPath: String,
    tarBallName: String
  ) {
    val idToken = authManager.fetchLoggedInWorkerIdToken()
    val requestFile = RequestBody.create(
      "application/tgz".toMediaTypeOrNull(),
      File(assignmentTarBallPath)
    )
    val filePart =
      MultipartBody.Part.createFormData(
        "file",
        tarBallName,
        requestFile
      )

    val md5sum = getMD5Digest(assignmentTarBallPath)
    val uploadFileRequest =
      UploadFileRequest(
        microtaskOutputContainer.cname,
        tarBallName,
        ChecksumAlgorithm.md5.toString(),
        md5sum
      )

    val dataPart = MultipartBody.Part.createFormData(
      "data", Gson().toJson(uploadFileRequest)
    )

    // Send the tarball
    karyaFileRepository.uploadKaryaFile(
      idToken,
      dataPart,
      filePart
    ).catch {
      throw it
    }.collect { fileRecord ->  // Because we want this to be synchronous
      karyaFileRepository.insertKaryaFile(fileRecord)
      assignmentRepository.updateOutputFileId(assignment.id, fileRecord.id)
    }
  }

  fun fetchVerifiedTasks(from: String = "") {
    viewModelScope.launch {
      val idToken = authManager.fetchLoggedInWorkerIdToken()

      assignmentRepository
        .getAssignments(idToken, "verified", from)
        .catch {
          throw it
        }
        .collect()
    }
  }

  /**
   * Returns a hot flow connected to the DB
   * @return [Flow] of list of [TaskRecord] wrapper in a [Result]
   */
  @Suppress("USELESS_CAST")
  fun getAllTasks() {
    taskRepository
      .getAllTasksFlow()
      .onStart { _dashboardUiState.emit(DashboardUiState.Loading) }
      .onEach { taskList ->
        val taskInfoList = mutableListOf<TaskInfo>()

        taskList.forEach { taskRecord ->
          val taskStatus = fetchTaskStatus(taskRecord.id)
          taskInfoList.add(
            TaskInfo(
              taskRecord.id,
              taskRecord.name,
              taskRecord.scenario_id.toString(),
              taskStatus
            )
          )
        }

        val success = DashboardUiState.Success(taskInfoList.sortedWith(taskInfoComparator))
        _dashboardUiState.emit(success)
      }
      .catch { throwable ->
        _dashboardUiState.emit(DashboardUiState.Error(throwable))
      }
      .launchIn(viewModelScope)
  }

  private suspend fun fetchTaskStatus(taskId: String): TaskStatus {
    return taskRepository.getTaskStatus(taskId)
  }

  fun syncWithServer() {
    viewModelScope.launch {
      submitCompletedTasks()
      fetchNewTasks()
    }
  }
}
