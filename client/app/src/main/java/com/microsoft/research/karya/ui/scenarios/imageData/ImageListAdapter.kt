package com.microsoft.research.karya.ui.scenarios.imageData

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import com.microsoft.research.karya.R
import com.microsoft.research.karya.utils.ImageUtils.bitmapFromFile
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.visible
import kotlinx.android.synthetic.main.microtask_image_data_grid_view_item.view.*

class ImageListAdapter(
  private var context: Context,
  private var images: MutableList<String>,
  private var imageClickListener: (Int) -> Unit
  ) : BaseAdapter() {

  override fun getCount(): Int {
    return images.size
  }

  override fun getItem(p0: Int): Any {
    return images[p0]
  }

  override fun getItemId(p0: Int): Long {
    return p0.toLong()
  }

  override fun getView(index: Int, p1: View?, p2: ViewGroup?): View {
    val view = p1 ?: LayoutInflater.from(context).inflate(R.layout.microtask_image_data_grid_view_item, p2, false)

    // Extract info
    val path = images[index]
    val text = if (index == 0) "Front" else "P$index"

    if (path == "") {
      view.altText.text = text
      view.altText.visible()
      view.image.invisible()
    } else {
      view.image.setImageBitmap(bitmapFromFile(path))
      view.image.visible()
      view.altText.invisible()
    }

    view.setOnClickListener { imageClickListener(index) }

    return view
  }

  fun updateItem(index: Int, path: String) {
    images[index] = path
    notifyDataSetChanged()
  }
}
