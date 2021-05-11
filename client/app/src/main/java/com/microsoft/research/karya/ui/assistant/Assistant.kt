package com.microsoft.research.karya.ui.assistant

import android.media.MediaPlayer
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.OnLifecycleEvent
import androidx.lifecycle.coroutineScope
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.manager.ResourceManager
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class Assistant
@AssistedInject
constructor(
  @Assisted lifecycleOwner: LifecycleOwner,
  private val resourceManager: ResourceManager,
  private val authManager: AuthManager,
) : LifecycleObserver {
  private lateinit var assistantPlayer: MediaPlayer
  private val lifecycle: Lifecycle = lifecycleOwner.lifecycle

  init {
    lifecycleOwner.lifecycle.addObserver(this)
  }

  fun playAssistantAudio(
    assistantAudio: AssistantAudio,
    uiCue: () -> Unit = {},
    onCompletionListener: (player: MediaPlayer) -> Unit = {},
    onErrorListener: () -> Unit = {},
  ) {
    lifecycle.coroutineScope.launch {
      val workerLanguage =
        withContext(Dispatchers.IO) {
          // TODO: Implement a logged-in worker cache in authManager
          return@withContext authManager.fetchLoggedInWorker().language
        }

      val audioFilePath = resourceManager.getAudioFilePath(workerLanguage, assistantAudio.name)
      playAssistantAudio(audioFilePath, uiCue, onCompletionListener, onErrorListener)
    }
  }

  fun playAssistantAudio(
    audioFilePath: String,
    uiCue: () -> Unit = {},
    onCompletionListener: () -> Unit = {},
    onErrorListener: () -> Unit = {},
  ) {
    if (!::assistantPlayer.isInitialized || !isAssistantAvailable()) {
      return
    }

    if (File(audioFilePath).exists()) {
      if (isAssistantAvailable()) {
        if (assistantPlayer.isPlaying) assistantPlayer.stop()

        assistantPlayer.setOnCompletionListener { onCompletionListener() }

        assistantPlayer.setOnErrorListener { _: MediaPlayer, _: Int, _: Int ->
          onErrorListener()
          // returning false here indicates that we have not handled the error and
          // onCompletionListener will be called
          // Since we are returning false, we can do all the destruction work in onCompletion like
          // we would have done
          // for the success case and only specify the error handling tasks in onErrorListener.
          return@setOnErrorListener false
        }

        uiCue()

        with(assistantPlayer) {
          reset()
          setDataSource(audioFilePath)
          prepare()
          start()
        }
      }
    } else {
      onCompletionListener()
      // TODO: Maybe add another listener for the case audio files are not available
    }
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
  private fun stopAssistant() {
    if (assistantPlayer.isPlaying) assistantPlayer.stop()
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
  private fun pauseAssistant() {
    if (assistantPlayer.isPlaying) {
      assistantPlayer.pause()
    }
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_CREATE)
  private fun initializePlayer() {
    if (!::assistantPlayer.isInitialized) {
      assistantPlayer = MediaPlayer()
    }
  }

  private fun isAssistantAvailable(): Boolean = lifecycle.currentState.isAtLeast(Lifecycle.State.CREATED)
}
