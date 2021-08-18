package com.microsoft.research.karya

import android.app.Application
import androidx.work.Configuration
import com.microsoft.research.karya.data.manager.NgDelegatingWorkerFactory
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp class KaryaApp : Application(), Configuration.Provider {

  @Inject
  lateinit var workerFactory: NgDelegatingWorkerFactory

  override fun getWorkManagerConfiguration(): Configuration =
    Configuration.Builder()
      .setMinimumLoggingLevel(android.util.Log.DEBUG)
      .setWorkerFactory(workerFactory)
      .build()
}
