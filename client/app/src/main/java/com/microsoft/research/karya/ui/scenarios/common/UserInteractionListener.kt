package com.microsoft.research.karya.ui.scenarios.common

import android.util.Log
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class UserInteractionListener(
    private val lifecycleOwner: LifecycleOwner,
    private val onInactivityTimeout: () -> Unit,
    private val inactivityTimeout: Long = 30000,
) : DefaultLifecycleObserver {

    init {
        lifecycleOwner.lifecycle.addObserver(this)
    }

    private var interactionTimeoutJob: Job? = null

    fun restartTimeout() {
        interactionTimeoutJob?.cancel()
        interactionTimeoutJob = lifecycleOwner.lifecycleScope.launch {
          Log.d("UserInteractionListener::", "restartTimeout()")
            delay(inactivityTimeout)
            if (isActive) {
              Log.d("UserInteractionListener::", "onInactivityTimeout()")
              onInactivityTimeout()
            }
        }
    }

    private fun releaseObserver() {
        interactionTimeoutJob?.cancel()
      Log.d("UserInteractionListener::", "releaseObserver()")
    }


    override fun onResume(owner: LifecycleOwner) {
        super.onResume(owner)
        restartTimeout()
    }

    override fun onStop(owner: LifecycleOwner) {
        super.onStart(owner)
        releaseObserver()
    }
}
