package com.microsoft.research.karya.ui.scenarios.imageData

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import com.microsoft.research.karya.R
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.visible
import kotlinx.android.synthetic.main.microtask_image_data_grid_view_item.view.*

class ImageListAdapter(private var context: Context, private var images: MutableList<String>) : BaseAdapter() {

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
      val exifInterface = ExifInterface(path)
      val orientation = exifInterface.getAttribute(ExifInterface.TAG_ORIENTATION)?.toInt() ?: 1
      val rotationMatrix = Matrix()
      rotationMatrix.postRotate(when (orientation) {
        ExifInterface.ORIENTATION_NORMAL -> 0f
        ExifInterface.ORIENTATION_ROTATE_90 -> 90f
        ExifInterface.ORIENTATION_ROTATE_180 -> 180f
        ExifInterface.ORIENTATION_ROTATE_270 -> 270f
        else -> 0f
      })
      val bitmap = BitmapFactory.decodeFile(path)
      val correctedBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, rotationMatrix, true)
      view.image.setImageBitmap(correctedBitmap)
      view.image.visible()
      view.altText.invisible()
    }

    return view
  }

  fun updateItem(index: Int, path: String) {
    images[index] = path
    notifyDataSetChanged()
  }
}
