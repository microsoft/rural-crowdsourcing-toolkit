package com.microsoft.research.karya.ui.scenarios.quiz

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.ImageView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R

class OptionImageAdapter(private val dataSet: ArrayList<String>, private val onImageOptionCheckboxClickListener: OnImageOptionCheckboxClickListener) :
  RecyclerView.Adapter<OptionImageAdapter.ViewHolder>() {

  var optionSelected = -1

  /**
   * Provide a reference to the type of views that you are using
   * (custom ViewHolder).
   */
  class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
    val optionIv: ImageView = view.findViewById(R.id.optionIv)
    val optionCard: CardView = view.findViewById(R.id.optionCard)
    val optionCheckbox: CheckBox = view.findViewById(R.id.optionCheckbox)
  }

  // Create new views (invoked by the layout manager)
  override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
    // Create a new view, which defines the UI of the list item
    val view = LayoutInflater.from(viewGroup.context)
      .inflate(R.layout.item_image_checkbox, viewGroup, false)

    return ViewHolder(view)
  }

  // Replace the contents of a view (invoked by the layout manager)
  override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {

    // Get element from your dataset at this position and replace the
    // contents of the view with that element
    val image = BitmapFactory.decodeFile(dataSet[position])
    viewHolder.optionIv.setImageBitmap(image)

    viewHolder.optionCheckbox.isSelected = optionSelected == position

    viewHolder.optionCard.setOnClickListener {
      optionSelected = position
      onImageOptionCheckboxClickListener.onClick(dataSet[position])
      notifyDataSetChanged()
    }

  }

  // Return the size of your dataset (invoked by the layout manager)
  override fun getItemCount() = dataSet.size

}
