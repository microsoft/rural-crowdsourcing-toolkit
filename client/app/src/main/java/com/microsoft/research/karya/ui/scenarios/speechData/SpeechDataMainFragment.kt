package com.microsoft.research.karya.ui.scenarios.speechData

import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.addCallback
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.*
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_common_back_button.view.*
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*
import kotlinx.android.synthetic.main.microtask_speech_data.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@AndroidEntryPoint
class SpeechDataMainFragment : BaseMTRendererFragment(R.layout.microtask_speech_data) {
  override val viewModel: SpeechDataMainViewModel by viewModels()
  val args: SpeechDataMainFragmentArgs by navArgs()

  override fun requiredPermissions(): Array<String> {
    return arrayOf(android.Manifest.permission.RECORD_AUDIO)
  }

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewModel(args.taskId, args.completed, args.total)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    // Setup speech data view model
    viewModel.setupSpeechDataViewModel()

    /** Set OnBackPressed callback */
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) { viewModel.onBackPressed() }

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString
        ?: getString(R.string.speech_recording_instruction)
    instructionTv.text = recordInstruction

    /** Set on click listeners */
    recordBtn.setOnClickListener { viewModel.handleRecordClick() }
    playBtn.setOnClickListener { viewModel.handlePlayClick() }
    nextBtnCv.setOnClickListener { viewModel.handleNextClick() }
    backBtnCv.setOnClickListener { viewModel.handleBackClick() }
  }

  private fun setupObservers() {
    viewModel.backBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
      backBtnCv.isClickable = state != DISABLED
      backBtnCv.backIv.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_back_disabled
          ENABLED -> R.drawable.ic_back_enabled
          ACTIVE -> R.drawable.ic_back_enabled
        }
      )
    }

    viewModel.recordBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
      recordBtn.isClickable = state != DISABLED
      recordBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_mic_disabled
          ENABLED -> R.drawable.ic_mic_enabled
          ACTIVE -> R.drawable.ic_mic_active
        }
      )
    }

    viewModel.playBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
      playBtn.isClickable = state != DISABLED
      playBtn.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_speaker_disabled
          ENABLED -> R.drawable.ic_speaker_enabled
          ACTIVE -> R.drawable.ic_speaker_active
        }
      )
    }

    viewModel.nextBtnState.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { state ->
      nextBtnCv.isClickable = state != DISABLED
      nextBtnCv.nextIv.setBackgroundResource(
        when (state) {
          DISABLED -> R.drawable.ic_next_disabled
          ENABLED -> R.drawable.ic_next_enabled
          ACTIVE -> R.drawable.ic_next_enabled
        }
      )
    }

    // Set microtask instruction if available
    viewModel.microTaskInstruction.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text ->
      if (!text.isNullOrEmpty()) {
        instructionTv.text = text
      }
    }

    viewModel.sentenceTvText.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text ->
      sentenceTv.text = text
    }

    viewModel.recordSecondsTvText.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { text ->
      recordSecondsTv.text = text
    }

    viewModel.recordCentiSecondsTvText.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { text ->
      recordCentiSecondsTv.text = text
    }

    viewModel.playbackProgressPb.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { progress ->
      playbackProgressPb.progress = progress
    }

    viewModel.playbackProgressPbMax.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { max ->
      playbackProgressPb.max = max
    }

    viewModel.playRecordPromptTrigger.observe(
      viewLifecycleOwner.lifecycle,
      viewLifecycleScope
    ) { play ->
      if (play) {
        playRecordPrompt()
      }
    }
  }

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
      },
      onErrorListener = {
        lifecycleScope.launch {
          viewModel.moveToPrerecording()
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
        },
        onErrorListener = {
          lifecycleScope.launch {
            viewModel.moveToPrerecording()
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
        },
        onErrorListener = {
          lifecycleScope.launch {
            viewModel.moveToPrerecording()
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
      },
      onErrorListener = {
        lifecycleScope.launch {
          viewModel.moveToPrerecording()
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
      },
      onErrorListener = {
        lifecycleScope.launch {
          viewModel.moveToPrerecording()
        }
      }
    )
  }

  private fun playNextAction() {

    assistant.playAssistantAudio(
      AssistantAudio.NEXT_ACTION,
      uiCue = {
        nextPointerIv.visible()
        nextBtnCv.nextIv.setBackgroundResource(R.drawable.ic_next_enabled)
      },
      onCompletionListener = {
        lifecycleScope.launch {
          nextBtnCv.nextIv.setBackgroundResource(R.drawable.ic_next_disabled)
          nextPointerIv.invisible()
          delay(500)
          playPreviousAction()
        }
      },
      onErrorListener = {
        lifecycleScope.launch {
          viewModel.moveToPrerecording()
        }
      }
    )
  }

  private fun playPreviousAction() {

    assistant.playAssistantAudio(
      AssistantAudio.PREVIOUS_ACTION,
      uiCue = {
        backPointerIv.visible()
        backBtnCv.backIv.setBackgroundResource(R.drawable.ic_back_enabled)
      },
      onCompletionListener = {
        lifecycleScope.launch {
          backBtnCv.backIv.setBackgroundResource(R.drawable.ic_back_disabled)
          backPointerIv.invisible()
          delay(500)
          viewModel.moveToPrerecording()
        }
      },
      onErrorListener = {
        lifecycleScope.launch {
          viewModel.moveToPrerecording()
        }
      }
    )
  }

  override fun onStop() {
    super.onStop()
    viewModel.cleanupOnStop()
  }

  override fun onResume() {
    super.onResume()
    viewModel.resetOnResume()
  }
}
