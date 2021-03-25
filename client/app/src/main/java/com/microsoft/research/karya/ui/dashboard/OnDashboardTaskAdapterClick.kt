// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.dashboard

import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo

interface OnDashboardTaskAdapterClick {
    fun onclickDashboardTaskItem(task: TaskInfo)
}
