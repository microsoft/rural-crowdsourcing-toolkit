// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.google.gson.JsonElement
import com.google.gson.JsonNull
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus

@Dao
interface MicrotaskAssignmentDaoExtra {
  @Query("UPDATE microtask_assignment SET output_file_id =:outputFileID WHERE id=:microtaskAssID ")
  suspend fun updateOutputFileID(microtaskAssID: String, outputFileID: String)

  /** Get list of microtask assignments by [status] */
  @Query("SELECT * FROM microtask_assignment WHERE status=:status")
  suspend fun getAssignmentsByStatus(status: MicrotaskAssignmentStatus): List<MicroTaskAssignmentRecord>

  /** Get list of incomplete microtask assignments */
  suspend fun getIncompleteAssignments(): List<MicroTaskAssignmentRecord> {
    return getAssignmentsByStatus(MicrotaskAssignmentStatus.ASSIGNED)
  }

  /** Get list of completed microtask assignments */
  suspend fun getCompletedAssignments(): List<MicroTaskAssignmentRecord> {
    return getAssignmentsByStatus(MicrotaskAssignmentStatus.COMPLETED)
  }

  /** Get list of skipped microtask assignments */
  suspend fun getLocalSkippedAssignments(): List<MicroTaskAssignmentRecord> {
    return getAssignmentsByStatus(MicrotaskAssignmentStatus.COMPLETED)
  }

  @Query(
    "SELECT count(id) FROM microtask_assignment WHERE " +
      "status=:status AND " +
      "microtask_id in (SELECT id from microtask WHERE task_id=:taskId)"
  )
  suspend fun getCountForTask(taskId: String, status: MicrotaskAssignmentStatus): Int

  /**
   * Query to get all the microtask assignment IDs for a given [taskId] and with a given list of
   * [statuses]
   */
  @Query(
    "SELECT id FROM microtask_assignment WHERE " +
      "status IN (:statuses) AND " +
      "microtask_id IN (SELECT id FROM microtask WHERE task_id=:taskId) " +
      "ORDER BY id"
  )
  suspend fun getIDsForTask(
    taskId: String,
    statuses: List<MicrotaskAssignmentStatus>,
  ): List<String>

  /**
   * Query to get all unsubmitted microtask assignments for a given [taskId]. [includeCompleted]
   * specifies if completed assignments that are not yet submitted should be included in the
   * returned list.
   */
  suspend fun getUnsubmittedIDsForTask(taskId: String, includeCompleted: Boolean): List<String> {
    return if (includeCompleted) {
      getIDsForTask(taskId, arrayListOf(MicrotaskAssignmentStatus.ASSIGNED, MicrotaskAssignmentStatus.COMPLETED))
    } else {
      getIDsForTask(taskId, arrayListOf(MicrotaskAssignmentStatus.ASSIGNED))
    }
  }

  /**
   * Query to mark the microtask assignment with the given [id] as complete with the given [output].
   */
  @Query(
    "UPDATE microtask_assignment SET " +
      "status=:status, output=:output, last_updated_at=:date, completed_at=:date " +
      "WHERE id=:id"
  )
  suspend fun markComplete(
    id: String,
    output: JsonElement,
    date: String,
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.COMPLETED,
  )

  /**
   * Query to mark the microtask assignment with the given [id] as complete with the given [output].
   */
  @Query(
    "UPDATE microtask_assignment SET " +
      "status=:status, output=:output, last_updated_at=:date, completed_at=:date " +
      "WHERE id=:id"
  )
  suspend fun markSkip(
    id: String,
    date: String,
    output: JsonElement = JsonNull.INSTANCE,
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.SKIPPED,
  )

  /** Query to mark an assignment as submitted */
  @Query("UPDATE microtask_assignment SET status=:status WHERE id=:id")
  suspend fun markSubmitted(
    id: String,
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.SUBMITTED,
  )

  /** Query to get list of assignments whose output karya files are in the server */
  @Query(
    "SELECT ma.* FROM microtask_assignment AS ma INNER JOIN karya_file AS kf ON ma.output_file_id = kf.id WHERE kf.in_box=:in_box"
  )
  suspend fun getAssignmentsWithUploadedFiles(in_box: Boolean = true): List<MicroTaskAssignmentRecord>

  /** Query to get count of assignments by status */
  @Query("SELECT COUNT(*) FROM microtask_assignment where status=:status")
  suspend fun getCountByStatus(status: MicrotaskAssignmentStatus): Int

  /** Query to get the total amount earned so far */
  @Query("SELECT SUM(credits) FROM microtask_assignment WHERE status=:status AND worker_id=:worker_id")
  suspend fun getTotalCreditsEarned(
    worker_id: String,
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.VERIFIED
  ): Float?
}
