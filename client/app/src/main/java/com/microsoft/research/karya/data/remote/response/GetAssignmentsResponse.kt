package com.microsoft.research.karya.data.remote.response

import com.microsoft.research.karya.data.model.karya.MicrotaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord

data class GetAssignmentsResponse(
    val tasks: List<TaskRecord>,
    val microtasks: List<MicrotaskRecord>,
    val assignments: List<MicrotaskAssignmentRecord>,
)
