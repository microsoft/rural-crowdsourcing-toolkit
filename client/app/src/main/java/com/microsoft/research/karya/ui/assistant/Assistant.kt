package com.microsoft.research.karya.ui.assistant

import android.media.MediaPlayer
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.OnLifecycleEvent
import java.io.File

class Assistant(
  private val lifecycle: Lifecycle,
) : LifecycleObserver {

  private lateinit var assistantPlayer: MediaPlayer

  fun playAssistantAudio(
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
        if (assistantPlayer.isPlaying) assistantPlayer.stop()

        assistantPlayer.setOnCompletionListener(onCompletionListener)

        assistantPlayer.setOnErrorListener { _: MediaPlayer, _: Int, _: Int ->
          onErrorListener()
          // returning false here indicates that we have not handled the error and onCompletionListener will be called
          // Since we are returning false, we can do all the destruction work in onCompletion like we would have done
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

  private fun isAssistantAvailable(): Boolean = lifecycle.currentState.isAtLeast(Lifecycle.State.STARTED)
}