package com.microsoft.research.karya.data.remote.response

import com.google.gson.annotations.SerializedName
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord

data class GetVerifiedAssignmentsResponse(
  @SerializedName("tasks") val tasks: List<TaskRecord>,
  @SerializedName("microtasks") val microTasks: List<MicroTaskRecord>
)
