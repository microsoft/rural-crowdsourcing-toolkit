// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.data.model.karya.enums.MicrotaskAssignmentStatus

@Dao
interface MicrotaskDaoExtra {
  @Query(
    "SELECT m.id FROM microtask AS m INNER JOIN microtask_assignment AS ma WHERE m.input_file_id IS NOT NULL AND ma.microtask_id = m.id AND ma.status=:status"
  )
  suspend fun getSubmittedMicrotasksWithInputFiles(
    status: MicrotaskAssignmentStatus = MicrotaskAssignmentStatus.SUBMITTED
  ): List<String>
}
