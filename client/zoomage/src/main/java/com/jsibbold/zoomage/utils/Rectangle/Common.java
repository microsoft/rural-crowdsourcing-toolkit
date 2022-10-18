package com.jsibbold.zoomage.utils.Rectangle;

import android.graphics.Matrix;
import android.graphics.RectF;

import com.jsibbold.zoomage.enums.TouchArea;

public class Common {

    // Minimum height for the crop rectangle
    public static float minHeight;
    // Minimum width for the crop rectangle
    public static float minWidth;

    public static RectF checkResizeBounds(RectF rectF, RectF bounds, float[] matrixValues, TouchArea touchArea) {
        System.out.println("RECTF BOUNDS PREV: " + rectF.left +" | " + rectF.top + " | " + rectF.bottom + " | " + rectF.right);
        float lDiff = scaleAndTranslateX(rectF.left, matrixValues) - bounds.left;
        float rDiff = scaleAndTranslateX(rectF.right, matrixValues) - bounds.right;
        float tDiff = scaleAndTranslateY(rectF.top, matrixValues) - bounds.top;
        float bDiff = scaleAndTranslateY(rectF.bottom, matrixValues) - bounds.bottom;

        if (lDiff < 0) {
            rectF.left -= lDiff;
        }
        if (rDiff > 0) {
            rectF.right -= rDiff;
        }
        if (tDiff < 0) {
            rectF.top -= tDiff;
        }
        if (bDiff > 0) {
            rectF.bottom -= bDiff;
        }

        // Check if the crop rectangle has minimum height and width
        float currentWidth = (rectF.right-rectF.left);
        float currentHeight = (rectF.bottom-rectF.top);

        if (currentWidth < minWidth) {
            if (touchArea == TouchArea.LEFT_TOP || touchArea == TouchArea.LEFT_BOTTOM || touchArea == TouchArea.LEFT_EDGE) {
                rectF.left = rectF.right - minWidth;
            }

            if (touchArea == TouchArea.RIGHT_TOP || touchArea == TouchArea.RIGHT_BOTTOM || touchArea == TouchArea.RIGHT_EDGE) {
                rectF.right = rectF.left + minWidth;
            }

        }

        if (currentHeight < minHeight) {
            if (touchArea == TouchArea.LEFT_TOP || touchArea == TouchArea.RIGHT_TOP || touchArea == TouchArea.TOP_EDGE) {
                rectF.top = rectF.bottom - minHeight;
            }

            if (touchArea == TouchArea.LEFT_BOTTOM || touchArea == TouchArea.RIGHT_BOTTOM || touchArea == TouchArea.BOTTOM_EDGE) {
                rectF.bottom = rectF.top + minHeight;
            }
        }

        return rectF;
    }

    public static RectF checkMoveBounds(RectF rectF, RectF bounds, float[] matrixValues) {
        float lDiff = scaleAndTranslateX(rectF.left, matrixValues) - bounds.left;
        float rDiff = scaleAndTranslateX(rectF.right, matrixValues) - bounds.right;
        float tDiff = scaleAndTranslateY(rectF.top, matrixValues) - bounds.top;
        float bDiff = scaleAndTranslateY(rectF.bottom, matrixValues) - bounds.bottom;

        if (lDiff < 0) {
            rectF.left -= lDiff;
            rectF.right -= lDiff;
        }
        if (rDiff > 0) {
            rectF.left -= rDiff;
            rectF.right -= rDiff;
        }
        if (tDiff < 0) {
            rectF.bottom -= tDiff;
            rectF.top -= tDiff;
        }
        if (bDiff > 0) {
            rectF.bottom -= bDiff;
            rectF.top -= bDiff;
        }

        return rectF;

    }

    public static float scaleAndTranslateX(float x, float[] matrixValues) {
        return x*matrixValues[Matrix.MSCALE_X] + matrixValues[Matrix.MTRANS_X];
    }

    public static float scaleAndTranslateY(float y, float[] matrixValues) {
        return y*matrixValues[Matrix.MSCALE_Y] + matrixValues[Matrix.MTRANS_Y];
    }

    public static float reverseScaleAndTranslateX(float x, float[] matrixValues) {
        return (x - matrixValues[Matrix.MTRANS_X])/matrixValues[Matrix.MSCALE_X];
    }

    public static float reverseScaleAndTranslateY(float y, float[] matrixValues) {
        return (y - matrixValues[Matrix.MTRANS_Y])/matrixValues[Matrix.MSCALE_Y];
    }
}
