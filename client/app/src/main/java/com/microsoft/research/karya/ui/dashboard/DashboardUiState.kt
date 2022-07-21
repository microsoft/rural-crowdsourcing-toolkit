package com.microsoft.research.karya.ui.dashboard

import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo

sealed class DashboardUiState {
  data class Success(val data: DashboardStateSuccess) : DashboardUiState()
  data class Error(val throwable: Throwable) : DashboardUiState()
  object Loading : DashboardUiState()
}

data class DashboardStateSuccess(val taskInfoData: List<TaskInfo>, val workerBalance: Float)
