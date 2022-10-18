package com.jsibbold.zoomage.utils.Rectangle;

import android.graphics.RectF;

import com.jsibbold.zoomage.enums.TouchArea;

public class TranslateUtils {
    private RectF bounds;
    // Selected Crop Rectangle
    private RectF rectF;
    // Bounds of the image rectangle
    private float[] matrixValues;


    public TranslateUtils(RectF rectF, RectF bounds, float[] matrixValues) {
        this.bounds = bounds;
        this.rectF = rectF;
        this.matrixValues = matrixValues;
    }

    public RectF translateRectF(TouchArea touchArea, float diffX, float diffY) {
        switch (touchArea) {
            case CENTER:
                moveFrame(diffX, diffY);
                break;
            case LEFT_TOP:
                moveHandleLT(diffX, diffY);
                break;
            case RIGHT_TOP:
                moveHandleRT(diffX, diffY);
                break;
            case LEFT_BOTTOM:
                moveHandleLB(diffX, diffY);
                break;
            case RIGHT_BOTTOM:
                moveHandleRB(diffX, diffY);
                break;
            case TOP_EDGE:
                moveEdgeTop(diffY);
                break;
            case LEFT_EDGE:
                moveEdgeLeft(diffX);
                break;
            case BOTTOM_EDGE:
                moveEdgeBottom(diffY);
                break;
            case RIGHT_EDGE:
                moveEdgeRight(diffX);
                break;
        }

        if (touchArea == TouchArea.CENTER) {
            // Adjust crop rectangle for move
            Common.checkMoveBounds(rectF, bounds, matrixValues);
        } else {
            // Adjust crop rectangle for resize if required
            Common.checkResizeBounds(rectF, bounds, matrixValues, touchArea);
        }

        // Check if the crop rectangle is not crossing image's bound
        return this.rectF;
    }

    private void moveEdgeTop(Float diffY) {
        // DO THIS FOR EVERY METHOD THAT MODIFIES SIZE OF CROP RECTANGLE
        // TODO: Write code to prevent too small width or height
        // TODO: Write code to make check if not translated out of bounds
        rectF.top += diffY;
    }

    private void moveEdgeLeft(Float diffX) {
        rectF.left += diffX;
    }

    private void moveEdgeBottom(Float diffY) {
        rectF.bottom += diffY;
    }

    private void moveEdgeRight(Float diffX) {
        rectF.right += diffX;
    }

    private void moveHandleRB(float diffX, float diffY) {
        rectF.right += diffX;
        rectF.bottom += diffY;
//        if (isWidthTooSmall()) {
//            float offsetX = mMinFrameSize - frameW
//            rectF.right += offsetX
//        }
//        if (isHeightTooSmall()) {
//            val offsetY = mMinFrameSize - frameH
//            rectF.bottom += offsetY
//        }
//            checkScaleBounds()
    }

    private void moveHandleLB(float diffX, float diffY) {
        rectF.left += diffX;
        rectF.bottom += diffY;
    }

    private void moveHandleRT(float diffX, float diffY) {
        rectF.right += diffX;
        rectF.top += diffY;
    }

    private void moveHandleLT(float diffX, float diffY) {
        rectF.left += diffX;
        rectF.top += diffY;
    }

    private void moveFrame(float diffX, float diffY) {
        rectF.left += diffX;
        rectF.right += diffX;
        rectF.bottom += diffY;
        rectF.top += diffY;
    }

}
