package com.microsoft.research.karya.ui.assistant

import android.media.MediaPlayer
import androidx.lifecycle.*
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
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
          return@withContext authManager.getLoggedInWorker().language
        }

      val audioFilePath = resourceManager.getAudioFilePath(workerLanguage, assistantAudio.fileName)
      playAssistantAudio(audioFilePath, uiCue, onCompletionListener, onErrorListener)
    }
  }

  private fun playAssistantAudio(
    audioFilePath: String,
    uiCue: () -> Unit = {},
    onCompletionListener: (player: MediaPlayer) -> Unit = {},
    onErrorListener: () -> Unit = {},
  ) {
    if (!::assistantPlayer.isInitialized || !isAssistantAvailable()) {
      return
    }

    if (File(audioFilePath).exists()) {
      if (isAssistantAvailable()) {
        stopAssistant()

        assistantPlayer.setOnCompletionListener(onCompletionListener)
        assistantPlayer.setOnErrorListener { _: MediaPlayer, _: Int, _: Int ->
          onErrorListener()
          return@setOnErrorListener true
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
      onErrorListener()
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
