package com.microsoft.research.karya.ui.leaderboard

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.data.model.karya.LeaderboardRecord
import com.microsoft.research.karya.databinding.ItemLeaderboardEntryBinding

class LeaderboardListAdapter(private var leaderboardItems: List<LeaderboardRecord>) :
  RecyclerView.Adapter<LeaderboardListAdapter.LeaderboardItemViewHolder>() {

  class LeaderboardItemViewHolder(private val binding: ItemLeaderboardEntryBinding) :
    RecyclerView.ViewHolder(binding.root) {

      fun bind(leaderboardItem: LeaderboardRecord) {
        with(binding) {
          rankTv.text = leaderboardItem.rank.toString()
          nameTv.text = leaderboardItem.name
          pointsTv.text = leaderboardItem.xp.toString()
        }
      }
    }

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LeaderboardItemViewHolder {
    val layoutInflater = LayoutInflater.from(parent.context)
    val binding = ItemLeaderboardEntryBinding.inflate(layoutInflater, parent, false)
    return LeaderboardItemViewHolder(binding)
  }

  override fun onBindViewHolder(holder: LeaderboardItemViewHolder, position: Int) {
    holder.bind(leaderboardItems[position])
  }

  override fun getItemCount(): Int {
    return leaderboardItems.size
  }

  fun updateList(items: List<LeaderboardRecord>) {
    leaderboardItems = items
    notifyDataSetChanged()
  }
}
