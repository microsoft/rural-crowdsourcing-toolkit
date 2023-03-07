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
    private val onInactivityTimeout: (timeoutCount: Int) -> Unit,
    private val inactivityTimeout: Long,
) : DefaultLifecycleObserver {

    init {
        lifecycleOwner.lifecycle.addObserver(this)
    }

    private var interactionTimeoutJob: Job? = null

  /**
   * This variable keeps tracks of number of timeouts in one session
   */
  private var timeoutsCount = 0;

  fun restartTimeout() {
        interactionTimeoutJob?.cancel()
        interactionTimeoutJob = lifecycleOwner.lifecycleScope.launch {
          Log.d("UserInteractionListener::", "restartTimeout()")
            delay(inactivityTimeout)
            if (isActive) {
              Log.d("UserInteractionListener::", "onInactivityTimeout()")
              timeoutsCount++;
              onInactivityTimeout(timeoutsCount)
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
