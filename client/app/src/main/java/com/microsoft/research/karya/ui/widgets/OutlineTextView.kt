package com.microsoft.research.karya.ui.widgets

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import androidx.core.graphics.withTranslation
import com.microsoft.research.karya.R

class OutlineTextView : androidx.appcompat.widget.AppCompatTextView {

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0) {
    setAttributes(attrs)
  }
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(context, attrs, defStyleAttr) {
    setAttributes(attrs)
  }

  companion object {
    private const val DEFAULT_OUTLINE_SIZE = 0f
    private const val DEFAULT_OUTLINE_COLOR = Color.TRANSPARENT
  }

  private var mOutlineSize: Float = DEFAULT_OUTLINE_SIZE
  private var mOutlineColor: Int = DEFAULT_OUTLINE_COLOR
  private var mTextColor: Int = currentTextColor
  private var mShadowRadius: Float = 0.0f
  private var mShadowDx: Float = 0.0f
  private var mShadowDy: Float = 0.0f
  private var mShadowColor: Int = currentTextColor

  private var isDrawing = false

  private fun setAttributes(attrs: AttributeSet?) {
    mTextColor = currentTextColor

    if (attrs != null) {
      val a = context.obtainStyledAttributes(attrs, R.styleable.OutlineTextView)

      // outline size
      if (a.hasValue(R.styleable.OutlineTextView_outlineSize)) {
        mOutlineSize = a.getDimension(R.styleable.OutlineTextView_outlineSize, DEFAULT_OUTLINE_SIZE)
      }
      // outline color
      if (a.hasValue(R.styleable.OutlineTextView_outlineColor)) {
        mOutlineColor = a.getColor(R.styleable.OutlineTextView_outlineColor, DEFAULT_OUTLINE_COLOR)
      }

      saveShadowParams()
      a.recycle()
    }
  }

  private fun setPaintToOutline() {
    val paint: Paint = paint
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = mOutlineSize
    super.setTextColor(mOutlineColor)
    super.setShadowLayer(mShadowRadius, mShadowDx, mShadowDy, mShadowColor)
  }

  private fun setPaintToRegular() {
    val paint: Paint = paint
    paint.style = Paint.Style.FILL
    paint.strokeWidth = 0F
    super.setTextColor(mTextColor)
  }

  private fun setPaintToShadow() {
    val paint: Paint = paint
    paint.style = Paint.Style.FILL
    paint.strokeWidth = 0F
    super.setTextColor(mShadowColor)
  }

  override fun setTextColor(color: Int) {
    super.setTextColor(color)
    mTextColor = color
  }

  fun setOutlineSize(size: Float) {
    mOutlineSize = size
  }

  fun setOutlineColor(color: Int) {
    mOutlineColor = color
  }

  private fun saveShadowParams() {
    mShadowDx = shadowDx
    mShadowDy = shadowDy
    mShadowColor = shadowColor
    mShadowRadius = shadowRadius
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    setPaintToOutline()
    super.onMeasure(widthMeasureSpec, heightMeasureSpec)
  }

  /**
   * This method draws the text with an outline and a hard shadow. We achieve this by updating the
   * [Paint] object's properties and then drawing text using that [Paint] object.
   *
   * The actual drawing takes place in 3 parts:
   *
   * 1. Drawing the shadow: We first translate the canvas with the pixel value of `mShadowDx` and
   * `mShadowDy`. Then we update our [Paint] object to match the `mShadowColor` provided by the
   * user. After that we call `super.onDraw()` to let TextView draw the text with those properties.
   * (We save the canvas state first before translating and restore it back after drawing the shadow
   * text. This is abstracted away by the `withTranslation` extension method)
   *
   * 2. Drawing the outline: Drawing the outline is simple, we just update the [Paint.Style] to
   * [Paint.Style.STROKE] and then call `super.onDraw()` to let TextView draw the text with those
   * properties.
   *
   * 3. Drawing the filled text: Drawing filed text is similar to outline, we just update the
   * [Paint.Style] to [Paint.Style.FILL] and then call `super.onDraw()` to let TextView draw the
   * text with those properties.
   *
   * The problem which can be faced using this approach is that if something calls invalidate it'll
   * run in an infinite draw loop, to solve that we save the isDrawing state. If an `invalidate()`
   * call is made during the draw phase we ignore it.
   *
   * @param[canvas] canvas on which the text will be drawn
   */
  override fun onDraw(canvas: Canvas?) {
    isDrawing = true

    canvas?.withTranslation(mShadowDx.dpToPx(context).toFloat(), mShadowDy.dpToPx(context).toFloat()) {
      setPaintToShadow()
      super.onDraw(canvas)
    }

    setPaintToOutline()
    super.onDraw(canvas)

    setPaintToRegular()
    super.onDraw(canvas)

    isDrawing = false
  }

  override fun invalidate() {
    if (isDrawing) return
    super.invalidate()
  }

  /**
   * Convenience method to convert density independent pixel(dp) value into device display specific
   * pixel value.
   * @param context Context to access device specific display metrics
   * @param dp density independent pixel value
   * @return device specific pixel value.
   */
  fun Float.dpToPx(context: Context): Int {
    val scale = context.resources.displayMetrics.density
    return (this * scale + 0.5f).toInt()
  }
}
