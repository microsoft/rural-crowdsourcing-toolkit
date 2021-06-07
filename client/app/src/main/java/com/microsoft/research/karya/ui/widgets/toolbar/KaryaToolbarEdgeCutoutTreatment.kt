package com.microsoft.research.karya.ui.widgets.toolbar

/*
 * Copyright 2017 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import com.google.android.material.shape.EdgeTreatment
import com.google.android.material.shape.ShapePath
import kotlin.math.abs
import kotlin.math.atan
import kotlin.math.sqrt

/**
 * Top edge treatment for the bottom app bar which "cutouts" a circular [ ].
 *
 * This edge features a downward semi-circular cutout from the edge line. The two corners created by
 * the cutout can optionally be rounded. The circular cutout can also support a vertically offset
 * FloatingActionButton; i.e., the cut-out need not be a perfect semi-circle, but could be an arc of
 * less than 180 degrees that does not start or finish with a vertical path. This vertical offset
 * must be positive.
 */
class KaryaToolbarEdgeCutoutTreatment(
  private var cutoutMargin: Float = 0F,
  private var cutoutRoundedCornerRadius: Float = 0F,
  private var cutoutVerticalOffset: Float = 0F,
) : EdgeTreatment(), Cloneable {
  init {
    require(cutoutVerticalOffset >= 0) { "cutoutVerticalOffset must be positive." }
  }

  private var viewDiameter = 0F
  private var horizontalOffset: Float = 0F
  private var viewCornerRadius = -1F

  override fun getEdgePath(length: Float, center: Float, interpolation: Float, shapePath: ShapePath) {
    if (viewDiameter == 0f) {
      // There is no cutout to draw.
      shapePath.lineTo(length, 0f)
      return
    }
    val cutoutDiameter = cutoutMargin * 2 + viewDiameter
    val cutoutRadius = cutoutDiameter / 2f
    val roundedCornerOffset = interpolation * cutoutRoundedCornerRadius
    val middle = center + horizontalOffset

    // The center offset of the cutout tweens between the vertical offset when attached, and the
    // cutoutRadius as it becomes detached.
    var verticalOffset = interpolation * cutoutVerticalOffset + (1 - interpolation) * cutoutRadius
    val verticalOffsetRatio = verticalOffset / cutoutRadius
    if (verticalOffsetRatio >= 1.0f) {
      // Vertical offset is so high that there's no curve to draw in the edge, i.e., the view is
      // actually above the edge so just draw a straight line.
      shapePath.lineTo(length, 0f)
      return // Early exit.
    }

    // Calculate the path of the cutout by calculating the location of two adjacent circles. One
    // circle is for the rounded corner. If the rounded corner circle radius is 0 the corner will
    // not be rounded. The other circle is the cutout.

    // Calculate the X distance between the center of the two adjacent circles using pythagorean
    // theorem.
    val cornerSize = viewCornerRadius * interpolation
    val useCircleCutout = viewCornerRadius == -1F || abs(viewCornerRadius * 2 - viewDiameter) < .1f
    var arcOffset = 0f
    if (!useCircleCutout) {
      verticalOffset = 0f
      arcOffset = ROUNDED_CORNER_VIEW_OFFSET
    }
    val distanceBetweenCenters = cutoutRadius + roundedCornerOffset
    val distanceBetweenCentersSquared = distanceBetweenCenters * distanceBetweenCenters
    val distanceY = verticalOffset + roundedCornerOffset
    val distanceX = sqrt((distanceBetweenCentersSquared - distanceY * distanceY).toDouble()).toFloat()

    // Calculate the x position of the rounded corner circles.
    val leftRoundedCornerCircleX = middle - distanceX
    val rightRoundedCornerCircleX = middle + distanceX

    // Calculate the arc between the center of the two circles.
    val cornerRadiusArcLength = Math.toDegrees(atan((distanceX / distanceY).toDouble())).toFloat()
    val cutoutArcOffset: Float = ARC_QUARTER - cornerRadiusArcLength + arcOffset

    // Draw the starting line up to the left rounded corner.
    shapePath.lineTo(/* x= */ leftRoundedCornerCircleX, 0f)

    // Draw the arc for the left rounded corner circle. The bounding box is the area around the
    // circle's center which is at `(leftRoundedCornerCircleX, roundedCornerOffset)`.
    shapePath.addArc(
      /* left= */ leftRoundedCornerCircleX - roundedCornerOffset,
      0f,
      /* right= */ leftRoundedCornerCircleX + roundedCornerOffset,
      /* bottom= */ roundedCornerOffset * 2,
      /* startAngle= */ ANGLE_UP.toFloat(),
      /* sweepAngle= */ cornerRadiusArcLength
    )
    if (useCircleCutout) {
      // Draw the cutout circle.
      shapePath.addArc(
        /* left= */ middle - cutoutRadius,
        /* top= */ -cutoutRadius - verticalOffset,
        /* right= */ middle + cutoutRadius,
        /* bottom= */ cutoutRadius - verticalOffset,
        /* startAngle= */ ANGLE_LEFT - cutoutArcOffset,
        /* sweepAngle= */ cutoutArcOffset * 2 - ARC_HALF
      )
    } else {
      val cutoutDiameter = cutoutMargin + cornerSize * 2f
      shapePath.addArc(
        /* left= */ middle - cutoutRadius,
        /* top= */ -(cornerSize + cutoutMargin),
        /* right= */ middle - cutoutRadius + cutoutDiameter,
        /* bottom= */ cutoutMargin + cornerSize,
        /* startAngle= */ ANGLE_LEFT - cutoutArcOffset,
        /* sweepAngle= */ (cutoutArcOffset * 2 - ARC_HALF) / 2f
      )
      shapePath.lineTo(middle + cutoutRadius - (cornerSize + cutoutMargin / 2f), /* y= */ cornerSize + cutoutMargin)
      shapePath.addArc(
        /* left= */ middle + cutoutRadius - (cornerSize * 2f + cutoutMargin),
        /* top= */ -(cornerSize + cutoutMargin),
        /* right= */ middle + cutoutRadius,
        /* bottom= */ cutoutMargin + cornerSize,
        90f,
        /* sweepAngle= */ -90 + cutoutArcOffset
      )
    }

    // Draw an arc for the right rounded corner circle. The bounding box is the area around the
    // circle's center which is at `(rightRoundedCornerCircleX, roundedCornerOffset)`.
    shapePath.addArc(
      /* left= */ rightRoundedCornerCircleX - roundedCornerOffset,
      0f,
      /* right= */ rightRoundedCornerCircleX + roundedCornerOffset,
      /* bottom= */ roundedCornerOffset * 2,
      /* startAngle= */ ANGLE_UP - cornerRadiusArcLength,
      /* sweepAngle= */ cornerRadiusArcLength
    )

    // Draw the ending line after the right rounded corner.
    shapePath.lineTo(/* x= */ length, 0f)
  }

  fun setViewCornerRadius(size: Float) {
    viewCornerRadius = size
  }

  fun setViewDiameter(diameter: Float) {
    viewDiameter = diameter
  }

  fun setViewHorizontalOffset(horizontalOffset: Float) {
    this.horizontalOffset = horizontalOffset
  }
  fun setViewVerticalOffset(verticalOffset: Float) {
    this.cutoutVerticalOffset = verticalOffset
  }

  companion object {
    private const val ARC_QUARTER = 90
    private const val ARC_HALF = 180
    private const val ANGLE_UP = 270
    private const val ANGLE_LEFT = 180
    private const val ROUNDED_CORNER_VIEW_OFFSET = 1.75f
  }
}
