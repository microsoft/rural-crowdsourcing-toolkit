package com.microsoft.research.karya.ui.widgets.toolbar

import android.content.Context
import android.content.res.ColorStateList
import android.content.res.TypedArray
import android.graphics.Paint
import android.os.Build.VERSION
import android.os.Build.VERSION_CODES
import android.util.AttributeSet
import android.util.Log
import android.view.View
import android.view.ViewGroup
import androidx.annotation.StyleableRes
import androidx.appcompat.content.res.AppCompatResources
import androidx.appcompat.widget.Toolbar
import androidx.core.graphics.drawable.DrawableCompat
import androidx.core.view.ViewCompat
import androidx.core.view.children
import com.google.android.material.resources.MaterialResources
import com.google.android.material.shape.MaterialShapeDrawable
import com.google.android.material.shape.MaterialShapeUtils
import com.google.android.material.shape.ShapeAppearanceModel
import com.google.android.material.theme.overlay.MaterialThemeOverlay.wrap
import com.microsoft.research.karya.R
import kotlin.properties.Delegates

class NGKaryaToolbar : Toolbar {
  private var cutoutMargin by Delegates.notNull<Float>()
  private var cutoutRoundedCornerRadius by Delegates.notNull<Float>()
  private var cutoutVerticalOffset by Delegates.notNull<Float>()

  private lateinit var assistantView: View

  private lateinit var materialShapeDrawable: MaterialShapeDrawable
  private lateinit var edgeCutoutTreatment: KaryaToolbarEdgeCutoutTreatment
  private lateinit var shapeAppearanceModel: ShapeAppearanceModel

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, R.attr.toolbarStyle)
  constructor(
    context: Context,
    attrs: AttributeSet?,
    defStyleAttr: Int
  ) : super(wrap(context, attrs, defStyleAttr, DEF_STYLE_RES), attrs, defStyleAttr) {
    setAttributes(attrs, defStyleAttr)
  }

  private fun setAttributes(attrs: AttributeSet?, defStyleAttr: Int) {
    val a = context.obtainStyledAttributes(attrs, R.styleable.NGKaryaToolbar, defStyleAttr, DEF_STYLE_RES)
    cutoutMargin = a.getDimensionPixelOffset(R.styleable.NGKaryaToolbar_cutoutMargin, 0).toFloat()
    cutoutRoundedCornerRadius =
      a.getDimensionPixelOffset(R.styleable.NGKaryaToolbar_cutoutRoundedCornerRadius, 0).toFloat()
    cutoutVerticalOffset = a.getDimensionPixelOffset(R.styleable.NGKaryaToolbar_cutoutVerticalOffset, 0).toFloat()
    val elevation = a.getDimensionPixelOffset(R.styleable.NGKaryaToolbar_elevation, 0).toFloat()
    val backgroundTint: ColorStateList? = getColorStateList(context, a, R.styleable.NGKaryaToolbar_backgroundTint)

    setBackground(cutoutMargin, cutoutRoundedCornerRadius, cutoutVerticalOffset, elevation)
    backgroundTint?.let { setBackgroundTint(it) }

    a.recycle()
  }

  private fun setBackground(
    cutoutMargin: Float,
    cutoutRoundedCornerRadius: Float,
    cutoutVerticalOffset: Float,
    elevation: Float
  ) {
    materialShapeDrawable = MaterialShapeDrawable()
    edgeCutoutTreatment = KaryaToolbarEdgeCutoutTreatment(cutoutMargin, cutoutRoundedCornerRadius, cutoutVerticalOffset)
    shapeAppearanceModel = ShapeAppearanceModel.builder().setBottomEdge(edgeCutoutTreatment).build()
    materialShapeDrawable.shapeAppearanceModel = shapeAppearanceModel
    materialShapeDrawable.shadowCompatibilityMode = MaterialShapeDrawable.SHADOW_COMPAT_MODE_ALWAYS
    materialShapeDrawable.paintStyle = Paint.Style.FILL
    materialShapeDrawable.initializeElevationOverlay(context)
    setElevation(elevation)
    DrawableCompat.setTintList(materialShapeDrawable, backgroundTintList)
    ViewCompat.setBackground(this, materialShapeDrawable)
  }

  private fun updateCutout(child: View) {
    getBottomEdgeTreatment().setViewDiameter(child.height.toFloat())
    materialShapeDrawable.invalidateSelf()
  }

  private fun getBottomEdgeTreatment(): KaryaToolbarEdgeCutoutTreatment {
    return materialShapeDrawable.shapeAppearanceModel.bottomEdge as KaryaToolbarEdgeCutoutTreatment
  }

  private fun findAssistantView() {
    children.forEach { child ->
      Log.d("TOOLBAR", "$child")
      if (child.tag == "KARYA_ASSISTANT") {
        Log.d("TOOLBAR", "$child with TAG")
        assistantView = child
        updateCutout(assistantView)
      }
    }
  }

  fun setBackgroundTint(backgroundTint: ColorStateList) {
    DrawableCompat.setTintList(materialShapeDrawable, backgroundTint)
  }

  fun getBackgroundTint(): ColorStateList? {
    return materialShapeDrawable.tintList
  }

  override fun setElevation(elevation: Float) {
    if (this::materialShapeDrawable.isInitialized) {
      materialShapeDrawable.elevation = elevation
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    MaterialShapeUtils.setParentAbsoluteElevation(this, materialShapeDrawable)

    // Automatically don't clip children for the parent view of KaryaToolbar. This allows the shadow
    // to be drawn outside the bounds.
    if (parent is ViewGroup) {
      (parent as ViewGroup).clipChildren = false
      materialShapeDrawable.invalidateSelf()
    }
  }

  override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
    super.onLayout(changed, l, t, r, b)
    findAssistantView()

    if (this::assistantView.isInitialized) {
      val left = (width / 2) - (assistantView.width / 2)
      val right = (width / 2) + (assistantView.width / 2)
      val top = height - (assistantView.height / 2) + cutoutVerticalOffset.toInt()
      val bottom = top + assistantView.height

      assistantView.layout(left, top, right, bottom)
    }
  }

  companion object {
    private const val DEF_STYLE_RES = R.style.Widget_MaterialComponents_Toolbar

    /** Taken from [MaterialResources] */
    fun getColorStateList(context: Context, attributes: TypedArray, @StyleableRes index: Int): ColorStateList? {
      if (attributes.hasValue(index)) {
        val resourceId = attributes.getResourceId(index, 0)
        if (resourceId != 0) {
          val value = AppCompatResources.getColorStateList(context, resourceId)
          if (value != null) {
            return value
          }
        }
      }

      // Reading a single color with getColorStateList() on API 15 and below doesn't always
      // correctly
      // read the value. Instead we'll first try to read the color directly here.
      if (VERSION.SDK_INT <= VERSION_CODES.ICE_CREAM_SANDWICH_MR1) {
        val color = attributes.getColor(index, -1)
        if (color != -1) {
          return ColorStateList.valueOf(color)
        }
      }
      return attributes.getColorStateList(index)
    }
  }
}
