// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus

@Dao
interface MicroTaskAssignmentDao : BasicDao<MicroTaskAssignmentRecord> {

  @Query("SELECT * FROM microtask_assignment")
  suspend fun getAll(): List<MicroTaskAssignmentRecord>

  @Query("SELECT * FROM microtask_assignment WHERE id == :id")
  suspend fun getById(id: String): MicroTaskAssignmentRecord

  @Query(
    """
      SELECT count(id)
      FROM microtask_assignment
      WHERE task_id=:taskId
      AND status = :status
    """
  )
  suspend fun getCountForTask(taskId: String, status: MicrotaskAssignmentStatus): Int

  /** Upsert a [record] in the table */
  @Transaction
  suspend fun upsert(record: MicroTaskAssignmentRecord) {
    insertForUpsert(record)
    updateForUpsert(record)
  }

  /** Upsert a list of [records] in the table */
  @Transaction
  suspend fun upsert(records: List<MicroTaskAssignmentRecord>) {
    insertForUpsert(records)
    updateForUpsert(records)
  }

  // TODO: Take into account the
  @Query("SELECT MAX(created_at) FROM microtask_assignment WHERE status == :status AND worker_id == :worker_id")
  suspend fun getNewAssignmentsFromTime(
    worker_id: String,
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.ASSIGNED
  ): String?

  @Query("SELECT MAX(verified_at) FROM microtask_assignment WHERE status == :status AND worker_id == :worker_id")
  suspend fun getNewVerifiedAssignmentsFromTime(
    worker_id: String,
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.VERIFIED
  ): String?
}
