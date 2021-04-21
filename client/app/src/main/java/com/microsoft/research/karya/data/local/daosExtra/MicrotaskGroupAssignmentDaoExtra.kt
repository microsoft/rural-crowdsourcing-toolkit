// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.data.model.karya.MicrotaskGroupAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskGroupAssignmentStatus

@Dao
interface MicrotaskGroupAssignmentDaoExtra {
  /** Get the list of completed group assignments */
  @Query("SELECT * FROM microtask_group_assignment WHERE status=:status")
  suspend fun getCompletedGroupAssignments(
      status: MicrotaskGroupAssignmentStatus = MicrotaskGroupAssignmentStatus.completed
  ): List<MicrotaskGroupAssignmentRecord>

  /** Mark a group assignment as submitted */
  @Query("UPDATE microtask_group_assignment SET status=:status WHERE id=:id")
  suspend fun markSubmitted(
      id: String,
      status: MicrotaskGroupAssignmentStatus = MicrotaskGroupAssignmentStatus.submitted
  )
}
