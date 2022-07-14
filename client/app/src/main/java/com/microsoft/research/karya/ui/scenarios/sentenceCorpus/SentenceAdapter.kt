package com.microsoft.research.karya.ui.scenarios.sentenceCorpus

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R


class SentenceAdapter(private val dataSet: ArrayList<String>, private val onRemoveItemClickListener: OnRemoveItemClickListener) :
  RecyclerView.Adapter<SentenceAdapter.ViewHolder>() {

  /**
   * Provide a reference to the type of views that you are using
   * (custom ViewHolder).
   */
  class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val sentenceTv: TextView = view.findViewById(R.id.floatSentenceTv)
    val removeIv: ImageView = view.findViewById(R.id.removeSentenceImageView)
  }

  // Create new views (invoked by the layout manager)
  override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
    // Create a new view, which defines the UI of the list item
    val view = LayoutInflater.from(viewGroup.context)
      .inflate(R.layout.item_float_sentence, viewGroup, false)

    return ViewHolder(view)
  }

  // Replace the contents of a view (invoked by the layout manager)
  override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {

    // Get element from your dataset at this position and replace the
    // contents of the view with that element
    viewHolder.sentenceTv.text = dataSet[position]
    // set Item Click Listerner
    viewHolder.removeIv.setOnClickListener { view ->
      onRemoveItemClickListener.onClick(view, position)
    }
  }

  // Return the size of your dataset (invoked by the layout manager)
  override fun getItemCount() = dataSet.size

}
