package com.microsoft.research.karya.ui.scenarios.transliterationVerification

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R


class WordListAdapter(
  private val words: ArrayList<String>,
  private val viewModel: TransliterationVerificationViewModel
) :
  RecyclerView.Adapter<WordListAdapter.ViewHolder>() {

  /**
   * Provide a reference to the type of views that you are using
   * (custom ViewHolder).
   */
  class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val wordTv: TextView
    val correctIb: ImageButton
    val incorrectIb: ImageButton

    init {
      // Define click listener for the ViewHolder's View.
      wordTv = view.findViewById(R.id.wordTv)
      correctIb = view.findViewById(R.id.correctIb)
      incorrectIb = view.findViewById(R.id.incorrectIb)

    }
  }

  // Create new views (invoked by the layout manager)
  override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
    // Create a new view, which defines the UI of the list item
    val view = LayoutInflater.from(viewGroup.context)
      .inflate(R.layout.item_transliteration_verification, viewGroup, false)

    return ViewHolder(view)
  }

  // Replace the contents of a view (invoked by the layout manager)
  override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {

    // Get element from your dataset at this position and replace the
    // contents of the view with that element
    viewHolder.wordTv.text = words[position]

    viewHolder.correctIb.setOnClickListener {
      viewHolder.correctIb.setBackgroundResource(R.drawable.ic_tick_on)
      viewHolder.incorrectIb.setBackgroundResource(R.drawable.ic_cross_off)
      viewModel.markCorrect(position)
    }
    viewHolder.incorrectIb.setOnClickListener {
      viewHolder.incorrectIb.setBackgroundResource(R.drawable.ic_cross_on)
      viewHolder.correctIb.setBackgroundResource(R.drawable.ic_tick_off)
      viewModel.markIncorrect(position)
    }
  }

  // Return the size of your dataset (invoked by the layout manager)
  override fun getItemCount() = words.size

}
