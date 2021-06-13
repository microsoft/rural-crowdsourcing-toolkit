package com.microsoft.research.karya.utils.extensions

import android.graphics.Bitmap
import android.graphics.Matrix

fun Bitmap.rotateRight(): Bitmap {
  val matrix = Matrix()
  matrix.postRotate(90.toFloat())
  return Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
}

fun Bitmap.rotateLeft(): Bitmap {
  val matrix = Matrix()
  matrix.postRotate((-90).toFloat())
  return Bitmap.createBitmap(this, 0, 0, width, height, matrix, true)
}
