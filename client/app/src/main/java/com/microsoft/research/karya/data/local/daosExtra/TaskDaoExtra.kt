// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.local.daosExtra

import androidx.room.Dao
import androidx.room.Query
import com.microsoft.research.karya.data.model.karya.TaskRecord

@Dao
interface TaskDaoExtra {

  @Query("SELECT t.* from task as t inner join task_assignment as ta on ta.task_id=t.id")
  suspend fun getAllTasksFromTaskAssignments(): List<TaskRecord>
}
