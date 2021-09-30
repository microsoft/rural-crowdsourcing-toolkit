package com.microsoft.research.karya.ui.scenarios.textCollection

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R


class SentenceAdapter(private val dataSet: MutableList<Pair<String, TextCollectionViewModel.SentenceVerificationStatus>>, val viewModel: TextCollectionViewModel) :
  RecyclerView.Adapter<SentenceAdapter.ViewHolder>() {

  /**
   * Provide a reference to the type of views that you are using
   * (custom ViewHolder).
   */
  class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val textCollectionSentenceTv: TextView
    val removeImageView: ImageView

    init {
      // Define click listener for the ViewHolder's View.
      textCollectionSentenceTv = view.findViewById(R.id.textCollectionSentenceTv)
      removeImageView = view.findViewById(R.id.removeImageView)
    }
  }

  // Create new views (invoked by the layout manager)
  override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
    // Create a new view, which defines the UI of the list item
    val view = LayoutInflater.from(viewGroup.context)
      .inflate(R.layout.item_float_word, viewGroup, false)

    return ViewHolder(view)
  }

  // Replace the contents of a view (invoked by the layout manager)
  override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {

    // Get element from your dataset at this position and replace the
    // contents of the view with that element
    viewHolder.textCollectionSentenceTv.text = dataSet[position].first
    viewHolder.removeImageView.setOnClickListener { viewModel.removeWord(dataSet[position].first) }
  }

  // Return the size of your dataset (invoked by the layout manager)
  override fun getItemCount() = dataSet.size

}


