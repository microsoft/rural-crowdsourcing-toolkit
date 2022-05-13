package com.microsoft.research.karya.ui.scenarios.imageAnnotation

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R


class LabelAdapter(private val dataSet: Array<Pair<String, Int>>, private val itemClickListenerListener: OnLabelItemClickListener) :
  RecyclerView.Adapter<LabelAdapter.ViewHolder>() {

  /**
   * Provide a reference to the type of views that you are using
   * (custom ViewHolder).
   */
  class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val labelTv: TextView = view.findViewById(R.id.image_annotation_label_tv)
    val labelColorCv: CardView = view.findViewById(R.id.image_annotation_label_color_cv)
  }

  // Create new views (invoked by the layout manager)
  override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
    // Create a new view, which defines the UI of the list item
    val view = LayoutInflater.from(viewGroup.context)
      .inflate(R.layout.image_annotation_label_item, viewGroup, false)

    return ViewHolder(view)
  }

  // Replace the contents of a view (invoked by the layout manager)
  override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {

    // Get element from your dataset at this position and replace the
    // contents of the view with that element
    viewHolder.labelTv.text = dataSet[position].first
    viewHolder.labelColorCv.setCardBackgroundColor(dataSet[position].second)
    // set Item Click Listerner
    viewHolder.itemView.setOnClickListener { view ->
      itemClickListenerListener.onClick(view, position)
    }
  }

  // Return the size of your dataset (invoked by the layout manager)
  override fun getItemCount() = dataSet.size

}
