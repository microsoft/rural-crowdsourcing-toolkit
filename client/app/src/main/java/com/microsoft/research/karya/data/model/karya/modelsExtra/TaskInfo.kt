// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya.modelsExtra

import androidx.room.DatabaseView

@DatabaseView(
  """
    SELECT task.id AS taskID,
    task.name AS taskName,
    task.scenario_name AS scenarioName,
    (SELECT COUNT(*) FROM task, microtask_assignment AS assignment WHERE assignment.status = '"assigned"' AND assignment.task_id = task.id) AS assignedMicrotasks,
    (SELECT COUNT(*) FROM task, microtask_assignment AS assignment WHERE assignment.status = '"completed"' AND assignment.task_id = task.id) AS completedMicrotasks,
    (SELECT COUNT(*) FROM task, microtask_assignment AS assignment WHERE assignment.status = '"submitted"' AND assignment.task_id = task.id) AS submittedMicrotasks,
    (SELECT COUNT(*) FROM task, microtask_assignment AS assignment WHERE assignment.status = '"verified"' AND assignment.task_id = task.id) AS verifiedMicrotasks
    FROM task
  """
)
data class TaskInfo(
  val taskID: String,
  val taskName: String,
  val scenarioName: String,
  val assignedMicrotasks: Int,
  val completedMicrotasks: Int,
  val submittedMicrotasks: Int,
  val verifiedMicrotasks: Int,
)
