package com.microsoft.research.karya.data.repo

import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskAssignmentDaoExtra
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.service.MicroTaskAssignmentAPI
import com.microsoft.research.karya.utils.AppConstants
import javax.inject.Inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import okhttp3.MultipartBody

class AssignmentRepository
@Inject
constructor(
  private val assignmentAPI: MicroTaskAssignmentAPI,
  private val assignmentDao: MicroTaskAssignmentDao,
  private val assignmentDaoExtra: MicrotaskAssignmentDaoExtra,
  private val microTaskDao: MicroTaskDao,
  private val taskDao: TaskDao,
) {

  fun getAssignments(idToken: String, type: String, from: String) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.getAssignments(idToken, type, from)
    val assignmentResponse = response.body()

    if (!response.isSuccessful) {
      error("Failed to get assignments")
    }

    if (assignmentResponse != null) {
      saveTasks(assignmentResponse.tasks)
      saveMicroTasks(assignmentResponse.microTasks)
      saveMicroTaskAssignments(assignmentResponse.assignments)

      emit(assignmentResponse)
    } else {
      error("Request failed, response body was null")
    }
  }

  fun submitAssignments(idToken: String, updates: List<MicroTaskAssignmentRecord>) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.submitAssignments(idToken, updates)
    val successAssignmentIDS = response.body()

    if (!response.isSuccessful) {
      error("Failed to upload file")
    }

    if (successAssignmentIDS != null) {
      emit(successAssignmentIDS)
    } else {
      error("Request failed, response body was null")
    }
  }

  fun submitAssignmentOutputFile(
    idToken: String,
    assignmentId: String,
    json: MultipartBody.Part,
    file: MultipartBody.Part
  ) = flow {
    val response = assignmentAPI.submitAssignmentOutputFile(idToken, assignmentId, json, file)
    val responseBody = response.body()

    if (!response.isSuccessful) {
      error("Failed to upload file")
    }

    if (responseBody != null) {
      emit(responseBody)
    } else {
      error("Request failed, response body was null")
    }
  }

  private suspend fun saveMicroTaskAssignments(assignments: List<MicroTaskAssignmentRecord>) {
    assignmentDao.upsert(assignments)
  }

  private suspend fun saveMicroTasks(microTasks: List<MicroTaskRecord>) {
    microTaskDao.upsert(microTasks)
  }

  private suspend fun saveTasks(tasks: List<TaskRecord>) {
    taskDao.upsert(tasks)
  }

  suspend fun getLocalCompletedAssignments(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getCompletedAssignments()
  }

  suspend fun getAssignmentsWithUploadedFiles(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getAssignmentsWithUploadedFiles()
  }

  suspend fun updateOutputFileId(assignmentId: String, fileRecordId: String) =
    withContext(Dispatchers.IO) { assignmentDaoExtra.updateOutputFileID(assignmentId, fileRecordId) }

  suspend fun markMicrotaskAssignmentsSubmitted(assignmentIds: List<String>) {
    assignmentIds.forEach { assignmentId -> assignmentDaoExtra.markSubmitted(assignmentId) }
  }

  suspend fun getIncompleteAssignments(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getIncompleteAssignments()
  }

  suspend fun getNewAssignmentsFromTime(): String {
    return assignmentDao.getNewAssignmentsFromTime() ?: AppConstants.INITIAL_TIME
  }
  suspend fun getNewVerifiedAssignmentsFromTime(): String {
    return assignmentDao.getNewVerifiedAssignmentsFromTime() ?: AppConstants.INITIAL_TIME
  }
}
