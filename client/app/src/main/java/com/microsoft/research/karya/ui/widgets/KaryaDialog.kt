package com.microsoft.research.karya.ui.widgets

import android.content.Context
import android.graphics.drawable.Drawable
import android.text.SpannableString
import android.util.AttributeSet
import android.view.LayoutInflater
import android.widget.FrameLayout
import androidx.annotation.ColorInt
import androidx.annotation.Dimension
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.constraintlayout.widget.ConstraintSet
import androidx.core.content.ContextCompat
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.ItemKaryaDialogBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.visible

class KaryaDialog : FrameLayout {

  private lateinit var binding: ItemKaryaDialogBinding
  private var crossPosition: CrossPosition = CrossPosition.TOP_RIGHT

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {
    setAttributes(attrs, defStyleAttr)
  }

  init {
    initView(context)
  }

  private fun setAttributes(attrs: AttributeSet?, defStyleAttr: Int) {

    val defaultTextColor = ContextCompat.getColor(context, R.color.background_text_color)
    val defaultBackgroundColor = ContextCompat.getColor(context, R.color.colorWhite)

    val a = context.obtainStyledAttributes(attrs, R.styleable.KaryaDialog, defStyleAttr, R.style.CardView)
    val text = a.getString(R.styleable.KaryaDialog_text)
    val textColor = a.getColor(R.styleable.KaryaDialog_textColor, defaultTextColor)
    val textSize = a.getDimension(R.styleable.KaryaDialog_textSize, 14f)
    val backgroundColor = a.getColor(R.styleable.KaryaDialog_backgroundColor, defaultBackgroundColor)
    val icon = a.getDrawable(R.styleable.KaryaDialog_icon)
    val crossPosition = a.getInt(R.styleable.KaryaDialog_crossPosition, 0)

    text?.let { setText(it) }
    icon?.let { setIcon(it) }
    setTextColor(textColor)
    setTextSize(textSize)
    setBackgroundColor(backgroundColor)
    setCrossPosition(crossPosition)

    a.recycle()
  }

  private fun initView(context: Context) {
    binding = ItemKaryaDialogBinding.inflate(LayoutInflater.from(context), this, true)
    binding.cross.setOnClickListener { this.gone() }
  }

  override fun setBackgroundColor(@ColorInt color: Int) {
    binding.card.setCardBackgroundColor(color)
  }

  fun setText(text: SpannableString) {
    binding.text.text = text
  }

  fun setText(text: String) {
    binding.text.text = text
  }

  fun setTextColor(@ColorInt color: Int) {
    binding.text.setTextColor(color)
  }

  fun setTextSize(@Dimension size: Float) {
    binding.text.textSize = size
  }

  fun setIcon(drawable: Drawable) {
    binding.icon.apply {
      visible()
      binding.icon.setImageDrawable(drawable)
    }
  }

  fun setCrossPosition(position: CrossPosition) {
    setCrossPosition(position.value)
  }

  private fun setCrossPosition(position: Int) {
    val oldCrossPosition = crossPosition
    crossPosition = CrossPosition.findEnumByPosition(position)

    if (crossPosition == oldCrossPosition) return

    val constraintLayout = binding.root
    val constraintSet = ConstraintSet()

    val updatedConstraintSet =
      when (crossPosition) {
        CrossPosition.TOP_RIGHT -> setCrossTopRight(constraintSet, constraintLayout)
        CrossPosition.CENTER_RIGHT -> setCrossCenterRight(constraintSet, constraintLayout)
      }

    constraintLayout.setConstraintSet(constraintSet)
  }

  private fun setCrossTopRight(constraintSet: ConstraintSet, constraintLayout: ConstraintLayout): ConstraintSet {
    constraintSet.clone(constraintLayout)

    constraintSet.connect(R.id.cross, ConstraintSet.START, R.id.card, ConstraintSet.END)
    constraintSet.connect(R.id.cross, ConstraintSet.END, R.id.card, ConstraintSet.END)
    constraintSet.connect(R.id.cross, ConstraintSet.TOP, R.id.card, ConstraintSet.TOP)
    constraintSet.connect(R.id.cross, ConstraintSet.BOTTOM, R.id.card, ConstraintSet.TOP)

    return constraintSet
  }

  private fun setCrossCenterRight(constraintSet: ConstraintSet, constraintLayout: ConstraintLayout): ConstraintSet {
    constraintSet.clone(constraintLayout)

    constraintSet.connect(R.id.cross, ConstraintSet.START, R.id.card, ConstraintSet.END)
    constraintSet.connect(R.id.cross, ConstraintSet.END, R.id.card, ConstraintSet.END)
    constraintSet.connect(R.id.cross, ConstraintSet.TOP, R.id.card, ConstraintSet.TOP)
    constraintSet.connect(R.id.cross, ConstraintSet.BOTTOM, R.id.card, ConstraintSet.BOTTOM)

    return constraintSet
  }

  enum class CrossPosition(val value: Int) {
    TOP_RIGHT(0),
    CENTER_RIGHT(1),
    ;

    companion object {
      fun findEnumByPosition(positionInt: Int): CrossPosition {
        return values().first { crossPosition -> crossPosition.value == positionInt }
      }
    }
  }
}
