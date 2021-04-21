package com.microsoft.research.karya.ui.dashboard

import android.content.Context
import androidx.lifecycle.ViewModel
import com.microsoft.research.karya.data.manager.SyncManager

class DashboardViewModel : ViewModel() {

  fun syncTasks(context: Context, appLanguage: Int) {
    SyncManager().sync(context, appLanguage)
  }
}
