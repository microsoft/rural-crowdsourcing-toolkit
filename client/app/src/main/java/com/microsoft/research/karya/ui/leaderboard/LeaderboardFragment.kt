package com.microsoft.research.karya.ui.leaderboard

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentLeaderboardBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class LeaderboardFragment : Fragment(R.layout.fragment_leaderboard) {
  private val binding by viewBinding(FragmentLeaderboardBinding::bind)
  private val viewModel by viewModels<LeaderboardViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUiState()
  }

  private fun setupViews() {
    with(binding) {
      leaderboardRv.adapter = LeaderboardListAdapter(emptyList())
      backBtn.backBtnCv.setOnClickListener {
        findNavController().popBackStack()
      }
    }
  }

  private fun observeUiState() {
    with(binding) {
      viewModel.leaderboardList.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { lbList ->
        if (lbList.isEmpty()) {
          leaderboardRv.gone()
          emptyLeaderboardTv.visible()
        } else {
          emptyLeaderboardTv.gone()
          leaderboardRv.visible()
          (leaderboardRv.adapter as LeaderboardListAdapter).updateList(lbList)
        }
      }
    }
  }
}