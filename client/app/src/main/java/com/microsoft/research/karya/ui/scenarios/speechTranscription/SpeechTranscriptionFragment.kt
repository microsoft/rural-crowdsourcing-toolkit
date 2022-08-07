package com.microsoft.research.karya.ui.scenarios.speechTranscription

import android.app.AlertDialog
import android.os.Bundle
import android.util.TypedValue
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.google.android.material.button.MaterialButton
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.ui.scenarios.speechTranscription.SpeechTranscriptionViewModel.ButtonState
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.microtask_common_back_button.view.*
import kotlinx.android.synthetic.main.microtask_common_next_button.view.*
import kotlinx.android.synthetic.main.microtask_common_playback_progress.view.*
import kotlinx.android.synthetic.main.microtask_speech_transcription.*
import kotlinx.android.synthetic.main.microtask_speech_transcription.backBtnCv
import kotlinx.android.synthetic.main.microtask_speech_transcription.instructionTv
import kotlinx.android.synthetic.main.microtask_speech_transcription.nextBtnCv
import kotlinx.android.synthetic.main.microtask_speech_transcription.playBtn

@AndroidEntryPoint
class SpeechTranscriptionFragment : BaseMTRendererFragment(R.layout.microtask_speech_transcription) {
  override val viewModel: SpeechTranscriptionViewModel by viewModels()
  val args: SpeechTranscriptionFragmentArgs by navArgs()

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

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString
        ?: getString(R.string.speech_recording_instruction)
    instructionTv.text = recordInstruction

    /** Set on click listeners for buttons */
    playBtn.setOnClickListener { viewModel.handlePlayClick() }
    nextBtnCv.setOnClickListener {
      // Check if user has entered the text
      if (transcriptionEt.text.isNullOrEmpty()) {
        showErrorDialog(getString(R.string.no_transcription_error_msg))
        return@setOnClickListener
      } else {
        val alertDialogBuilder = AlertDialog.Builder(requireContext())
        alertDialogBuilder.setTitle("Review the transcription.")
        alertDialogBuilder.setMessage(transcriptionEt.text.toString())
        alertDialogBuilder.setPositiveButton(R.string.yes) { _, _ ->
          viewModel.setTranscriptionText(transcriptionEt.text.toString())
          viewModel.handleNextClick()
          transcriptionEt.text.clear()
        }
        alertDialogBuilder.setNegativeButton(R.string.no) { _, _ -> }
        val alertDialog = alertDialogBuilder.create()
        alertDialog.setCancelable(true)
        alertDialog.setCanceledOnTouchOutside(true)
        alertDialog.show()
      }
    }

    backBtnCv.setOnClickListener { viewModel.handleBackClick() }
  }

  private fun setupObservers() {
    viewModel.assistWords.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { words ->
      if (words.isEmpty() && assistanceFl.childCount != 0) {
        // Clear the edit text
        transcriptionEt.setText("")
        return@observe
      }
      // Only add if Flow layout is empty
      if (assistanceFl.childCount != 0) {
        return@observe
      }
      for (word in words) {
        val wordButton = MaterialButton(requireContext())
        wordButton.setTextSize(TypedValue.COMPLEX_UNIT_SP, R.dimen._14ssp.toFloat())
        wordButton.text = word
        wordButton.setOnClickListener {
          transcriptionEt.setText(transcriptionEt.text.toString() + " " + word)
          transcriptionEt.setSelection(transcriptionEt.length())//placing cursor at the end of the text
        }
        assistanceFl.addView(wordButton)
      }
    }

    viewModel.transcriptionText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      transcriptionEt.setText(text)
    }

    viewModel.playbackSecondsTvText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      playbackProgress.secondsTv.text = text
    }

    viewModel.playbackCentiSecondsTvText.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { text ->
      playbackProgress.centiSecondsTv.text = text
    }

    viewModel.playbackProgressPbMax.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { max ->
      playbackProgress.progressPb.max = max
    }

    viewModel.playbackProgress.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { progress ->
      playbackProgress.progressPb.progress = progress
    }

    viewModel.navAndMediaBtnGroup.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { states ->
      flushButtonStates(states.first, states.second, states.third)
    }

    viewModel.showErrorWithDialog.observe(
      viewLifecycleOwner.lifecycle, viewLifecycleScope
    ) { msg ->
      if (msg.isNotEmpty()) {
        showErrorDialog(msg)
      }
    }
  }

  private fun showErrorDialog(msg: String) {
    val alertDialogBuilder = AlertDialog.Builder(requireContext())
    alertDialogBuilder.setMessage(msg)
    alertDialogBuilder.setNeutralButton("Ok") { _, _ ->
    }
    val alertDialog = alertDialogBuilder.create()
    alertDialog.setCancelable(false)
    alertDialog.setCanceledOnTouchOutside(false)
    alertDialog.show()
  }

  /** Flush the button states */
  private fun flushButtonStates(
    backBtnState: ButtonState,
    playBtnState: ButtonState,
    nextBtnState: ButtonState
  ) {
    playBtn.isClickable = playBtnState != ButtonState.DISABLED
    backBtnCv.isClickable = backBtnState != ButtonState.DISABLED
    nextBtnCv.isClickable = nextBtnState != ButtonState.DISABLED

    playBtn.setBackgroundResource(
      when (playBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_speaker_disabled
        ButtonState.ENABLED -> R.drawable.ic_speaker_enabled
        ButtonState.ACTIVE -> R.drawable.ic_speaker_active
      }
    )

    nextBtnCv.nextIv.setBackgroundResource(
      when (nextBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_next_disabled
        ButtonState.ENABLED -> R.drawable.ic_next_enabled
        ButtonState.ACTIVE -> R.drawable.ic_next_enabled
      }
    )

    backBtnCv.backIv.setBackgroundResource(
      when (backBtnState) {
        ButtonState.DISABLED -> R.drawable.ic_back_disabled
        ButtonState.ENABLED -> R.drawable.ic_back_enabled
        ButtonState.ACTIVE -> R.drawable.ic_back_enabled
      }
    )
  }

}
