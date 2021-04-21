// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.dashboard

import com.microsoft.research.karya.database.modelsExtra.TaskInfo

interface OnDashboardTaskAdapterClick {
  fun onclickDashboardTaskItem(task: TaskInfo)
}
