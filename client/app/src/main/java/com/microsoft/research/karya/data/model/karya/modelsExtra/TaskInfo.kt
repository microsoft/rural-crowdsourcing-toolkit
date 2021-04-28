// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya.modelsExtra

data class TaskInfo(
    val taskID: String,
    val taskName: String,
    val scenarioName: String,
    val incompleteMicrotasks: Int,
    val completedMicrotasks: Int,
    val submittedMicrotasks: Int,
    val verifiedMicrotasks: Int,
)