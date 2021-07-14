package com.microsoft.research.karya.data.repo

import com.google.gson.JsonElement
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

  fun getNewAssignments(idToken: String, from: String) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.getNewAssignments(idToken, from)
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

  fun getVerifiedAssignments(idToken: String, from: String) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.getVerifiedAssignments(idToken, from)
    val assignmentResponse = response.body()

    if (!response.isSuccessful) {
      error("Failed to get assignments")
    }

    if (assignmentResponse != null) {
      saveMicroTaskAssignments(assignmentResponse)
      emit(assignmentResponse)
    } else {
      error("Request failed, response body was null")
    }
  }

  fun submitCompletedAssignments(idToken: String, updates: List<MicroTaskAssignmentRecord>) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.submitCompletedAssignments(idToken, updates)
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

  fun submitSkippedAssignments(idToken: String, ids: List<String>) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.submitSkippedAssignments(idToken, ids)

    if (!response.isSuccessful) {
      error("Failed to upload file")
    }

    markMicrotaskAssignmentsSubmitted(ids)
    emit(response)
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

  fun getInputFile(idToken: String, assignmentId: String) = flow {
    val response = assignmentAPI.getInputFile(idToken, assignmentId)

    if (!response.isSuccessful) {
      error("Failed to get file")
    }

    emit(response)
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

  suspend fun getAssignmentById(assignmentId: String): MicroTaskAssignmentRecord {
    return assignmentDao.getById(assignmentId)
  }

  suspend fun getLocalCompletedAssignments(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getCompletedAssignments()
  }

  suspend fun getAssignmentsWithUploadedFiles(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getAssignmentsWithUploadedFiles()
  }

  suspend fun updateOutputFileId(assignmentId: String, fileRecordId: String) =
    withContext(Dispatchers.IO) { assignmentDaoExtra.updateOutputFileID(assignmentId, fileRecordId) }

  suspend fun markComplete(
    id: String,
    output: JsonElement,
    date: String,
  ) {
    assignmentDaoExtra.markComplete(id, output, date)
  }

  suspend fun markSkip(id: String, date: String) {
    assignmentDaoExtra.markSkip(id, date)
  }

  suspend fun markMicrotaskAssignmentsSubmitted(assignmentIds: List<String>) {
    assignmentIds.forEach { assignmentId -> assignmentDaoExtra.markSubmitted(assignmentId) }
  }

  suspend fun getIncompleteAssignments(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getIncompleteAssignments()
  }

  suspend fun getLocalSkippedAssignments(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getLocalSkippedAssignments()
  }

  suspend fun getNewAssignmentsFromTime(worker_id: String): String {
    return assignmentDao.getNewAssignmentsFromTime(worker_id) ?: AppConstants.INITIAL_TIME
  }
  suspend fun getNewVerifiedAssignmentsFromTime(worker_id: String): String {
    return assignmentDao.getNewVerifiedAssignmentsFromTime(worker_id) ?: AppConstants.INITIAL_TIME
  }

  suspend fun getTotalCreditsEarned(worker_id: String): Float? {
    return assignmentDaoExtra.getTotalCreditsEarned(worker_id)
  }

  suspend fun getUnsubmittedIDsForTask(task_id: String, includeCompleted: Boolean): List<String> {
    return assignmentDaoExtra.getUnsubmittedIDsForTask(task_id, includeCompleted)
  }

}
