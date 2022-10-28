package com.microsoft.research.karya.ui.scenarios.imageAnnotation

import android.view.View

interface OnLabelItemClickListener {
  fun onClick(labelView: View, position: Int)
}
