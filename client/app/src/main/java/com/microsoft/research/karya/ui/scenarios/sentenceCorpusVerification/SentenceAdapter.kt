package com.microsoft.research.karya.ui.scenarios.sentenceCorpusVerification

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButtonToggleGroup
import com.microsoft.research.karya.R
import kotlinx.android.synthetic.main.microtask_image_annotation_verification_fragment.*


class SentenceAdapter(private val dataSet: ArrayList<String>, private val onScoreToggleGroupButtonListener: OnScoreToggleGroupButtonListener) :
  RecyclerView.Adapter<SentenceAdapter.ViewHolder>() {

  /**
   * Provide a reference to the type of views that you are using
   * (custom ViewHolder).
   */
  class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val sentenceTv: TextView = view.findViewById(R.id.floatSentenceTv)
    val toggleGroup: MaterialButtonToggleGroup = view.findViewById(R.id.scoreToggleGroup)
    val validButton: Button = view.findViewById(R.id.scoreValidBtn)
    val errorButton: Button = view.findViewById(R.id.scoreErrorBtn)
    val invalidButton: Button = view.findViewById(R.id.scoreInvalidBtn)
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
    viewHolder.toggleGroup.addOnButtonCheckedListener { group, checkedId, isChecked ->
      if (isChecked) {
        when (checkedId) {
          R.id.scoreValidBtn -> onScoreToggleGroupButtonListener.onClick(dataSet[position], R.id.scoreValidBtn)
          R.id.scoreErrorBtn -> onScoreToggleGroupButtonListener.onClick(dataSet[position], R.id.scoreErrorBtn)
          R.id.scoreInvalidBtn -> onScoreToggleGroupButtonListener.onClick(dataSet[position], R.id.scoreInvalidBtn)
        }
      }
    }

    viewHolder.toggleGroup
  }

  // Return the size of your dataset (invoked by the layout manager)
  override fun getItemCount() = dataSet.size

}
