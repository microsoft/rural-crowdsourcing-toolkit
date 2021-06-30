package com.microsoft.research.karya.ui.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.core.view.isVisible
import androidx.core.view.updatePadding
import androidx.navigation.findNavController
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CircleCrop
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.KaryaToolbarBinding
import com.microsoft.research.karya.utils.extensions.visible

class KaryaToolbar : FrameLayout {
  private lateinit var binding: KaryaToolbarBinding

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {
    setAttributes(attrs, defStyleAttr)
  }

  init {
    initView(context)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    disableClipping()
    updatePadding(bottom = (binding.assistant.height / 2))
  }

  private fun initView(context: Context) {
    binding = KaryaToolbarBinding.inflate(LayoutInflater.from(context), this, true)
    binding.backIcon.apply { setOnClickListener { findNavController().navigateUp() } }
  }

  private fun setAttributes(attrs: AttributeSet?, defStyleAttr: Int) {
    val a =
      context.obtainStyledAttributes(attrs, R.styleable.KaryaToolbar, defStyleAttr, R.style.Widget_AppCompat_Toolbar)
    val title = a.getString(R.styleable.KaryaToolbar_title)
    val startIcon = a.getDrawable(R.styleable.KaryaToolbar_startIcon)
    val endIcon = a.getDrawable(R.styleable.KaryaToolbar_endIcon)
    val showBackButton = a.getBoolean(R.styleable.KaryaToolbar_showBackButton, false)

    if (title != null) {
      setTitle(title)
    }
    if (startIcon != null) {
      setStartIcon(startIcon)
    }
    if (endIcon != null) {
      setEndIcon(endIcon)
    }
    showBackIcon(showBackButton)
    a.recycle()
  }

  /**
   * We do not want our FrameLayout to clip our Assistant Button which draws beyond the the Toolbar.
   * In order to do that we need to disable clipping from all the parents of the [KaryaToolbar].
   * This recursive method does that by checking all the parents and then setting the `clipChildren`
   * property to `false`.
   */
  private fun disableClipping() {
    var parent = this.parent
    while (parent is ViewGroup) {
      parent.clipChildren = false
      parent = parent.parent
    }
  }

  fun setTitle(title: String) {
    require(!binding.startIcon.isVisible) {
      "Toolbar cannot display both Title and StartIcon/Profile at the same time. Please remove StartIcon/Profile before setting Title"
    }

    binding.title.apply {
      text = title
      visible()
    }
  }

  fun setStartIcon(startIcon: Drawable) {
    require(!binding.title.isVisible) {
      "Toolbar cannot display both StartIcon/Profile and Title at the same time. Please remove StartIcon/Profile before setting Title"
    }

    binding.startIcon.apply {
      setImageDrawable(startIcon)
      visible()
    }
  }

  fun setEndIcon(endIcon: Drawable) {
    binding.startIcon.apply {
      setImageDrawable(endIcon)
      visible()
    }
  }

  fun setProfilePicture(profilePicture: Bitmap) {
    require(!binding.title.isVisible) {
      "Toolbar cannot display both Title and StartIcon/Profile at the same time. Please remove Title before setting StartIcon/Profile"
    }

    binding.startIcon.apply {
      Glide.with(context).load(profilePicture).transform(CircleCrop()).into(this)

      visible()
    }
  }

  fun showBackIcon(showIcon: Boolean) {
    binding.backIcon.isVisible = showIcon
  }

  fun setProfileClickListener(onClick: () -> Unit) {
    binding.startIcon.apply {
      visible()
      setOnClickListener { onClick() }
    }
  }

  fun setEndIconClickListener(onClick: () -> Unit) {
    binding.endIcon.apply {
      visible()
      setOnClickListener { onClick() }
    }
  }

  fun setAssistantClickListener(onClick: () -> Unit) {
    binding.assistant.apply { setOnClickListener { onClick() } }
  }
}
