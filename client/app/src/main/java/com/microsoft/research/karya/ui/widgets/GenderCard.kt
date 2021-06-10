package com.microsoft.research.karya.ui.widgets

import android.content.Context
import android.graphics.drawable.Drawable
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.ItemGenderCardBinding

class GenderCard : FrameLayout {
  private val binding: ItemGenderCardBinding

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {
    setAttributes(attrs, defStyleAttr)
  }

  init {
    binding = ItemGenderCardBinding.inflate(LayoutInflater.from(context), this, true)
    binding.cvGender.setBackgroundResource(R.drawable.gender_selector)
  }

  private fun setAttributes(attrs: AttributeSet?, defStyleAttr: Int) {
    val a = context.obtainStyledAttributes(attrs, R.styleable.GenderCard, defStyleAttr, R.style.CardView)
    val title = a.getString(R.styleable.GenderCard_title)
    val icon = a.getDrawable(R.styleable.GenderCard_icon)

    setTitle(title)
    setIcon(icon)
    a.recycle()
  }

  fun setTitle(title: String?) {
    title ?: return
    binding.title.text = title
  }

  fun setIcon(icon: Drawable?) {
    icon ?: return
    binding.icon.setImageDrawable(icon)
  }
}
