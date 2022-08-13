package com.microsoft.research.karya.ui.homeScreen

import android.os.Bundle
import android.view.View
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentHomeScreenBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class HomeScreenFragment : BaseFragment(R.layout.fragment_home_screen) {

  private val binding by viewBinding(FragmentHomeScreenBinding::bind)
  private val viewModel by viewModels<HomeScreenViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUiState()
  }

  override fun onResume() {
    super.onResume()
    viewModel.refreshXPPoints()
    viewModel.refreshTaskSummary()
    viewModel.refreshPerformanceSummary()
    viewModel.refreshEarningSummary()
  }

  private fun setupViews() {
    with(binding) {
      // Move to profile on name click
      nameCv.setOnClickListener {
        val action = HomeScreenFragmentDirections.actionHomeScreenToLeaderboard()
        findNavController().navigate(action)
      }

      // Move to task dashboard on task click
      taskSummaryCv.setOnClickListener {
        val action = HomeScreenFragmentDirections.actionHomeScreenToDashboard()
        findNavController().navigate(action)
      }
    }
  }

  private fun observeUiState() {
    // XP points
    viewModel.points.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { points ->
      binding.pointsTv.text = points.toString()
    }
    // Set name of the user
    viewModel.name.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { name ->
      binding.nameTv.text = name
    }
    // Set phone number of the user
    viewModel.phoneNumber.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { phoneNumber ->
      binding.phoneNumberTv.text = phoneNumber
    }

    // Task summary
    viewModel.taskSummary.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { status ->
      with(binding) {
        numIncompleteTv.text = status.assignedMicrotasks.toString()
        numCompletedTv.text = status.completedMicrotasks.toString()
        numSubmittedTv.text = status.submittedMicrotasks.toString()
        numVerifiedTv.text = status.verifiedMicrotasks.toString()
        numSkippedTv.text = status.skippedMicrotasks.toString()
        numExpiredTv.text = status.expiredMicrotasks.toString()
      }
    }

    // Performance summary
    viewModel.performanceSummary.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { perf ->
      with(binding) {
        recordingScore.rating = perf.recordingAccuracy
        transcriptionScore.rating = perf.transcriptionAccuracy
        typingScore.rating = perf.typingAccuracy
        imageTaskScore.rating = perf.imageAnnotationAccuracy
      }
    }

    // Earnings summary
    viewModel.earningStatus.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { status ->
      with(binding) {
        earningWeekTv.text = status.earnedWeek.toString()
        earningTotalTv.text = status.earnedTotal.toString()
        paidTotalTv.text = status.paidTotal.toString()
      }
    }
  }
}
