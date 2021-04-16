package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.WorkManager
import com.microsoft.research.karya.ui.dashboard.DashboardActivity

class SyncManager() {

    fun sync(context: Context, appLanguage: Int) {
        val workRequest = OneTimeWorkRequest.Builder(DashboardActivity.PerformSyncBackground::class.java)
        val data = Data.Builder()

        data.putInt("appLanguageId", appLanguage)

        //Set Input Data
        workRequest.setInputData(data.build())
        val workManager = WorkManager.getInstance(context)

        val constraints = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
        val task = workRequest.setConstraints(constraints).build()

        workManager.enqueueUniqueWork(
            BoxSyncWorker.WORK_NAME,
            ExistingWorkPolicy.KEEP,
            task
        )
    }
}
