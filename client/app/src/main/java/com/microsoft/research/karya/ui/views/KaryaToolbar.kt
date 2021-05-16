package com.microsoft.research.karya.ui.views

import android.content.Context
import android.graphics.Bitmap
import android.util.AttributeSet
import androidx.appcompat.widget.Toolbar
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.AppToolbarBinding
import com.microsoft.research.karya.utils.extensions.visible

class KaryaToolbar : Toolbar {

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr)

  private lateinit var binding: AppToolbarBinding

  init {
    initView(context)
  }

  private fun initView(context: Context) {
    val view = inflate(context, R.layout.app_toolbar, this)
    binding = AppToolbarBinding.bind(view)
  }

  fun setTitle(title: String) {
    binding.title.apply {
      text = title
      visible()
    }
  }

  fun showProfilePicture() {
    binding.profilePictureIv.visible()
  }

  fun setProfilePicture(profilePicture: Bitmap) {
    binding.profilePictureIv.apply {
      setImageBitmap(profilePicture)
      visible()
    }
  }
}
