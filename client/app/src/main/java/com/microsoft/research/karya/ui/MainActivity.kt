package com.microsoft.research.karya.ui

import android.content.res.Configuration
import android.content.res.Resources
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.databinding.ActivityMainBinding
import com.microsoft.research.karya.utils.extensions.viewBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
  private val binding by viewBinding(ActivityMainBinding::inflate)

  @Inject
  lateinit var authManager: AuthManager

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(binding.root)
  }

  fun setActivityLocale(languageCode: String) {
    val locale = Locale(languageCode)
    Locale.setDefault(locale)
    val resources: Resources = resources
    val config: Configuration = resources.configuration
    config.setLocale(locale)
    config.setLayoutDirection(locale)
    resources.updateConfiguration(config, resources.displayMetrics)
  }

  /**
   * Set locale on resume
   */
  override fun onResume() {
    super.onResume()

    CoroutineScope(Dispatchers.IO).launch {
      try {
        val worker = authManager.getLoggedInWorker()
        val languageCode = worker.language
        setActivityLocale(languageCode)
      } catch (e: Throwable) {
        // No logged in worker. Ignore
      }
    }

  }

    private var userInteractionCallback: () -> Unit = {}
    fun setUserInteractionCallback(callback: () -> Unit) {
        userInteractionCallback = callback
    }

    override fun onUserInteraction() {
        super.onUserInteraction()
        userInteractionCallback()
    }
}
