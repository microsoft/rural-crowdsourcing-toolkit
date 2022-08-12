package com.microsoft.research.karya.data.repo

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.reflect.TypeToken
import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskAssignmentDaoExtra
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus
import com.microsoft.research.karya.data.model.karya.enums.ScenarioType
import com.microsoft.research.karya.data.model.karya.modelsExtra.SpeechDataReport
import com.microsoft.research.karya.data.service.MicroTaskAssignmentAPI
import com.microsoft.research.karya.utils.DateUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import okhttp3.MultipartBody
import javax.inject.Inject

private const val INITIAL_TIME = "1970-01-01T00:00:00Z"

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
      saveTasks(assignmentResponse.tasks)
      saveMicroTasks(assignmentResponse.microTasks)
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

  fun submitSkippedAssignments(idToken: String, updates: List<MicroTaskAssignmentRecord>) = flow {
    if (idToken.isEmpty()) {
      error("Either Access Code or ID Token is required")
    }

    val response = assignmentAPI.submitSkippedAssignments(idToken, updates)
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
    withContext(Dispatchers.IO) {
      assignmentDaoExtra.updateOutputFileID(
        assignmentId,
        fileRecordId
      )
    }

  suspend fun markComplete(
    id: String,
    output: JsonElement,
    logs: JsonElement,
    date: String,
  ) {
    assignmentDaoExtra.markComplete(id, output, logs, date)
  }

  suspend fun markSkip(id: String, date: String) {
    assignmentDaoExtra.markSkip(id, date)
  }

  suspend fun markExpire(id: String, date: String) {
    assignmentDaoExtra.markExpire(id, date)
  }

  suspend fun markAssigned(id: String, date: String) {
    assignmentDaoExtra.markAssigned(id, date)
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

  suspend fun getLocalExpiredAssignments(): List<MicroTaskAssignmentRecord> {
    return assignmentDaoExtra.getLocalExpiredAssignments()
  }

  suspend fun getNewAssignmentsFromTime(worker_id: String): String {
    return assignmentDao.getNewAssignmentsFromTime(worker_id) ?: INITIAL_TIME
  }

  suspend fun getNewVerifiedAssignmentsFromTime(worker_id: String): String {
    return assignmentDao.getNewVerifiedAssignmentsFromTime(worker_id) ?: INITIAL_TIME
  }

  suspend fun getTotalCreditsEarned(worker_id: String): Float {
    val baseCredits = assignmentDaoExtra.getTotalBaseCreditsEarned(worker_id)
    val bonusCredits = assignmentDaoExtra.getTotalCreditsEarned(worker_id)
    return (baseCredits ?: 0.0f) + (bonusCredits ?: 0.0f)
  }

  suspend fun getIDsForTask(task_id: String, statuses: List<MicrotaskAssignmentStatus>): List<String> {
    return assignmentDaoExtra.getIDsForTask(task_id, statuses)
  }

  suspend fun getUnsubmittedIDsForTask(task_id: String, includeCompleted: Boolean): List<String> {
    return assignmentDaoExtra.getUnsubmittedIDsForTask(task_id, includeCompleted)
  }

  suspend fun getLocalVerifiedAssignments(task_id: String): List<String> {
    return assignmentDaoExtra.getLocalVerifiedAssignments(task_id)
  }

  suspend fun updateExpired(worker_id: String) {
    val currentTime = DateUtils.getCurrentDate()
    assignmentDaoExtra.updateExpired(worker_id, currentTime)
  }

  suspend fun getSpeechReportSummary(worker_id: String, task_id: String): SpeechDataReport? {
    val reports = assignmentDaoExtra.getReportsForTask(worker_id, task_id)
    val reportSummary: SpeechDataReport = SpeechDataReport(0.0f, 0.0f, 0.0f)
    var count = 0
    for (report in reports) {
      try {
        val reportObj = report.asJsonObject
        if (reportObj.has("accuracy")) {
          val accuracy = reportObj.get("accuracy").asFloat
          val quality = reportObj.get("quality").asFloat
          val volume = reportObj.get("volume").asFloat
          reportSummary.accuracy += accuracy
          reportSummary.quality += quality
          reportSummary.volume += volume
          count += 1
        }
      } catch(e: Exception) {}
    }
    if (count > 0) {
      reportSummary.accuracy /= (count * 2.0f / 5)
      reportSummary.quality /= (count * 2.0f / 5)
      reportSummary.volume /= (count * 2.0f / 5)
      return reportSummary
    }
    return null
  }

  private fun reduceTaskReports(reports: List<JsonObject>, keys: List<String>, scale: Float = 1.0f): JsonObject {
    val summary: MutableMap<String, Float> = mutableMapOf()
    val count: MutableMap<String, Int> = mutableMapOf()
    keys.forEach { key ->
      summary[key] = 0.0f
      count[key] = 0
    }

    reports.forEach { report ->
      keys.forEach { key ->
        try {
          if (report.has(key)) {
            summary[key] = summary[key]!! + report.get(key).asFloat
            count[key] = count[key]!! + 1
          }
        } catch (e: Exception) {}
      }
    }

    val finalReport = JsonObject()
    keys.forEach { key ->
      val keyCount = count[key]!!
      if (keyCount > 0) {
        val keySummary = summary[key]!! * scale / keyCount
        finalReport.addProperty(key, keySummary)
      }
    }

    return finalReport
  }

  suspend fun getTaskReportSummary(worker_id: String): Map<String, JsonObject> {
    val assignmentReports = assignmentDaoExtra.getAssignmentReports(worker_id)
    var taskReports: MutableMap<String, MutableList<JsonObject>> = mutableMapOf()

    assignmentReports.forEach { ar ->
      if (!taskReports.containsKey(ar.task_id)) {
        taskReports[ar.task_id] = mutableListOf()
      }
      if (ar.report != null && !ar.report.isJsonNull) {
        try {
          taskReports[ar.task_id]!!.add(ar.report.asJsonObject)
        } catch (e: Exception) {}
      }
    }

    var taskSummary: MutableMap<String, JsonObject> = mutableMapOf()
    taskReports.forEach { it ->
      val task_id = it.key
      val reports = it.value

      val scenarioName = taskDao.getById(task_id).scenario_name

      val summary = when (scenarioName) {
        ScenarioType.SPEECH_DATA ->
          reduceTaskReports(reports, arrayListOf("accuracy", "volume", "quality"), 2.5f)
        ScenarioType.IMAGE_ANNOTATION ->
          reduceTaskReports(reports, arrayListOf("accuracy"), 5f)
        ScenarioType.SENTENCE_CORPUS ->
          reduceTaskReports(reports, arrayListOf("accuracy"), 5f)
        ScenarioType.SPEECH_TRANSCRIPTION ->
          reduceTaskReports(reports, arrayListOf("accuracy"), 5f)
        else -> JsonObject()
      }

      taskSummary[task_id] = summary
    }

    return taskSummary.toMap()
  }
}
