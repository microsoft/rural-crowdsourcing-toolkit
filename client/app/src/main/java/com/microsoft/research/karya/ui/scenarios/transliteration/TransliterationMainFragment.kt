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
import com.microsoft.research.karya.data.local.enum.AssistantAudio
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.ACTIVE
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.DISABLED
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMainViewModel.ButtonState.ENABLED
import com.microsoft.research.karya.ui.scenarios.transliteration.TransliterationMainViewModel
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.speech_data_main.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@AndroidEntryPoint
class TransliterationMainFragment : BaseMTRendererFragment(R.layout.speech_data_main) {
  override val viewModel: TransliterationMainViewModel by viewModels()
  val args: SpeechDataMainFragmentArgs by navArgs()

  override fun requiredPermissions(): Array<String> {
    return emptyArray()
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewmodel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    /** Set OnBackPressed callback */
    requireActivity().onBackPressedDispatcher.addCallback(viewLifecycleOwner) { viewModel.onBackPressed() }

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString ?: getString(R.string.record_sentence_desc)
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
    recordBtn.setOnClickListener { viewModel.handleRecordClick() }
    playBtn.setOnClickListener { viewModel.handlePlayClick() }
    nextBtn.setOnClickListener { viewModel.handleNextClick() }
    backBtn.setOnClickListener { viewModel.handleBackClick() }
  }

  private fun setupObservers() {
    viewModel.wordTvText.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text -> SET TEXT HERE}
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
          viewModel.moveToPrerecording()
        }
      }
    )
  }

  override fun onStop() {
    super.onStop()
    viewModel.cleanupOnStop()
  }
}
