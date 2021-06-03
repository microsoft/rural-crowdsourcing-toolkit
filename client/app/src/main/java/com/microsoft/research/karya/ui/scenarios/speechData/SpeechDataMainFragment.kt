package com.microsoft.research.karya.ui.scenarios.speechData

import android.graphics.Color
import android.os.Bundle
import android.view.View
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.DISABLED
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.ENABLED
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.ACTIVE
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.speech_data_main.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
@AndroidEntryPoint
class SpeechDataMainFragment: BaseMTRendererFragment (R.layout.speech_data_main) {
  override val viewmodel: SpeechDataMainViewModel by viewModels()
  val args: SpeechDataMainFragmentArgs by navArgs()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    viewmodel.setupViewmodel(args.taskId!!, 0, 0)

    setupObservers()

    /** record instruction */
    val recordInstruction = viewmodel.task.params.asJsonObject.get("instruction").asString ?: getString(R.string.record_sentence_desc)
    recordPromptTv.text = recordInstruction

    /** Set card corner radius */
    recordBtnCv.addOnLayoutChangeListener {
        _: View,
        left: Int,
        _: Int,
        right: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int ->
      recordBtnCv.radius = (right - left).toFloat() / 2
    }

    playBtnCv.addOnLayoutChangeListener { _: View, left: Int, _: Int, right: Int, _: Int, _: Int, _: Int, _: Int, _: Int
      ->
      playBtnCv.radius = (right - left).toFloat() / 2
    }

    /** Set on click listeners */
    recordBtn.setOnClickListener { viewmodel.handleRecordClick() }
    playBtn.setOnClickListener { viewmodel.handlePlayClick() }
    nextBtn.setOnClickListener { viewmodel.handleNextClick() }
    backBtn.setOnClickListener { viewmodel.handleBackClick() }

  }

  private fun setupObservers() {
    viewmodel.backBtnState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      backBtn.isClickable = state != DISABLED
      backBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_back_disabled
          ENABLED -> R.drawable.ic_back_enabled
          ACTIVE -> R.drawable.ic_back_enabled
        }
      )
    }

    viewmodel.recordBtnState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      recordBtn.isClickable = state != DISABLED
      recordBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_mic_disabled
          ENABLED -> R.drawable.ic_mic_enabled
          ACTIVE -> R.drawable.ic_mic_enabled
        }
      )
    }

    viewmodel.playBtnState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      playBtn.isClickable = state != DISABLED
      playBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_speaker_disabled
          ENABLED -> R.drawable.ic_speaker_enabled
          ACTIVE -> R.drawable.ic_speaker_enabled
        }
      )
    }

    viewmodel.nextBtnState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      nextBtn.isClickable = state != DISABLED
      nextBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_next_disabled
          ENABLED -> R.drawable.ic_next_enabled
          ACTIVE -> R.drawable.ic_next_enabled
        }
      )
    }

    viewmodel.sentenceTvText.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { text ->
      sentenceTv.text = text
    }

    viewmodel.recordSecondsTvText.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { text ->
      recordSecondsTv.text = text
    }

    viewmodel.recordCentiSecondsTvText.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { text ->
      recordCentiSecondsTv.text = text
    }

    viewmodel.playbackProgressPb.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { progress ->
      playbackProgressPb.progress = progress
    }

    viewmodel.playbackProgressPbMax.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { max ->
      playbackProgressPb.max = max
    }

    viewmodel.playRecordPromptTrigger.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { play ->
      if (play) {
        playRecordPrompt()
      }
    }

  }

  //TODO: Call onBackPressed from viewmodel

  private fun playRecordPrompt() {
    val oldColor = sentenceTv.currentTextColor

    assistant.playAssistantAudio(
      AssistantAudio.RECORD_SENTENCE,
      uiCue = {
        sentenceTv.setTextColor(Color.parseColor("#CC6666"))
        sentencePointerIv.visible()
      },
      onCompletionListener = {
        lifecycleScope.launch {
          sentenceTv.setTextColor(oldColor)
          sentencePointerIv.invisible()
          delay(500)
          playRecordAction()
        }
      }
    )
  }

  private fun playRecordAction() {

    lifecycleScope.launch {
      assistant.playAssistantAudio(
        AssistantAudio.RECORD_ACTION,
        uiCue = {
          recordPointerIv.visible()
          recordBtn.setBackgroundResource(R.drawable.ic_mic_enabled)
        },
        onCompletionListener = {
          lifecycleScope.launch {
            recordPointerIv.invisible()
            delay(500)
            playStopAction()
          }
        }
      )
      delay(1500)
      recordBtn.setBackgroundResource(R.drawable.ic_mic_active)
    }
  }

  private fun playStopAction() {

    lifecycleScope.launch {
      assistant.playAssistantAudio(
        AssistantAudio.STOP_ACTION,
        uiCue = { recordPointerIv.visible() },
        onCompletionListener = {
          lifecycleScope.launch {
            recordPointerIv.invisible()
            delay(500)
            playListenAction()
          }
        }
      )
      delay(500)
      recordBtn.setBackgroundResource(R.drawable.ic_mic_disabled)
    }
  }

  private fun playListenAction() {

    assistant.playAssistantAudio(
      AssistantAudio.LISTEN_ACTION,
      uiCue = {
        playPointerIv.visible()
        playBtn.setBackgroundResource(R.drawable.ic_speaker_active)
      },
      onCompletionListener = {
        lifecycleScope.launch {
          playBtn.setBackgroundResource(R.drawable.ic_speaker_disabled)
          playPointerIv.invisible()
          delay(500)
          playRerecordAction()
        }
      }
    )
  }

  private fun playRerecordAction() {

    assistant.playAssistantAudio(
      AssistantAudio.RERECORD_ACTION,
      uiCue = {
        recordPointerIv.visible()
        recordBtn.setBackgroundResource(R.drawable.ic_mic_enabled)
      },
      onCompletionListener = {
        lifecycleScope.launch {
          recordBtn.setBackgroundResource(R.drawable.ic_mic_disabled)
          recordPointerIv.invisible()
          delay(500)
          playNextAction()
        }
      }
    )
  }

  private fun playNextAction() {

    assistant.playAssistantAudio(
      AssistantAudio.NEXT_ACTION,
      uiCue = {
        nextPointerIv.visible()
        nextBtn.setBackgroundResource(R.drawable.ic_next_enabled)
      },
      onCompletionListener = {
        lifecycleScope.launch {
          nextBtn.setBackgroundResource(R.drawable.ic_next_disabled)
          nextPointerIv.invisible()
          delay(500)
          playPreviousAction()
        }
      }
    )
  }

  private fun playPreviousAction() {

    assistant.playAssistantAudio(
      AssistantAudio.PREVIOUS_ACTION,
      uiCue = {
        backPointerIv.visible()
        backBtn.setBackgroundResource(R.drawable.ic_back_enabled)
      },
      onCompletionListener = {
        lifecycleScope.launch {
          backBtn.setBackgroundResource(R.drawable.ic_back_disabled)
          backPointerIv.invisible()
          delay(500)
          viewmodel.moveToPrerecording()
        }
      }
    )
  }

}