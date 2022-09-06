package com.microsoft.research.karya.utils.spotlight

import android.media.MediaPlayer
import android.view.View
import android.view.animation.DecelerateInterpolator
import android.view.animation.Interpolator
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.OnLifecycleEvent
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.takusemba.spotlight.OnSpotlightListener
import com.takusemba.spotlight.OnTargetListener
import com.takusemba.spotlight.Spotlight
import com.takusemba.spotlight.Target
import kotlinx.coroutines.flow.first

class SpotlightBuilderWrapper(
  var fragment: BaseFragment,
  var targetsData: List<TargetData>,
  var backgroundColor: Int = fragment.resources.getColor(R.color.c_trans_grey),
  var duration: Long = 1000L,
  var animation: Interpolator = DecelerateInterpolator(2f),
  onCompletionListener: () -> Unit = {},
) : LifecycleObserver {

  var spotlightObject: Spotlight

  init {
    // Add this class as an observer to lifeycle of fragment
    fragment.viewLifecycleOwner.lifecycle.addObserver(this)

    val targets = targetsData.map { targetsData ->

      val root = ConstraintLayout(fragment.requireContext())
      val overlay = fragment.layoutInflater.inflate(R.layout.spotlight_target_temp, root)
      val nextBtn = overlay.findViewById<View>(R.id.nextBtn)
      val replayBtn = overlay.findViewById<View>(R.id.replayBtn)

      fun playAssistantAudio(uiCue: () -> Unit, onCompletionListener: (player: MediaPlayer) -> Unit = {}) {
        fragment.assistant.playAssistantAudio(
          targetsData.audio,
          uiCue = {
            nextBtn.disable()
            replayBtn.disable()
            uiCue()
          },
          onCompletionListener = {
            onCompletionListener(it)
            nextBtn.enable()
            replayBtn.enable()
          },
          onErrorListener = {
            nextBtn.enable()
            replayBtn.enable()
          }
        )
      }

      nextBtn.disable()
      replayBtn.disable()

      val targetObject = Target.Builder()
      with(targetsData) {
        if (anchorView != null) targetObject.setAnchor(anchorView!!) else targetObject.setAnchor(anchorFloat!!)
      }
      targetObject
        .setShape(targetsData.shape)
        .setOverlay(overlay)
        .setOnTargetListener(object : OnTargetListener {
          override fun onStarted() {
            playAssistantAudio(targetsData.uiCue, targetsData.onCompletionListener)
          }

          override fun onEnded() {

          }
        })

      // Set click listener on Replay Btn
      replayBtn.setOnClickListener {
        playAssistantAudio(targetsData.uiCue, targetsData.onCompletionListener)
      }
      // Return the target object
      return@map targetObject.build()
    }
    spotlightObject = Spotlight.Builder(fragment.requireActivity())
      .setTargets(targets)
      .setBackgroundColor(backgroundColor)
      .setDuration(duration)
      .setAnimation(animation)
      .setOnSpotlightListener(object : OnSpotlightListener {
        override fun onEnded() {
          onCompletionListener()
        }

        override fun onStarted() {}

      })
      .build()

    targets.forEach { target ->
      val nextBtn = target.overlay!!.findViewById<View>(R.id.nextBtn)
      val onNextClick = View.OnClickListener { spotlightObject.next() }
      nextBtn.setOnClickListener(onNextClick)
    }
  }

  fun start() {
    spotlightObject.start()
  }

  @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
  fun stopSpotlight() {
    spotlightObject.finish()
  }
}
