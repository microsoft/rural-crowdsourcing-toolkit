package com.jsibbold.zoomage.utils.Polygon;

import android.graphics.PointF;
import android.graphics.RectF;

import com.jsibbold.zoomage.dataClass.Polygon;

public class TranslateUtils {
    private RectF bounds;
    // Selected Crop Rectangle
    private Polygon polygon;
    // Bounds of the image rectangle
    private float[] matrixValues;


    public TranslateUtils(Polygon polygon, RectF bounds, float[] matrixValues) {
        this.bounds = bounds;
        this.polygon = polygon;
        this.matrixValues = matrixValues;
    }

    public Polygon translateRectF(int touchPoint, float diffX, float diffY) {

        if (touchPoint == TouchUtils.INSIDE_POLYGON) {
            moveFrame(diffX, diffY);
        } else if (touchPoint != TouchUtils.OUT_OF_BOUNDS) {
            moveCorner(diffX, diffY, touchPoint);
        }

        if (touchPoint == TouchUtils.INSIDE_POLYGON) {
            // Adjust crop rectangle for move
            Common.checkMoveBounds(polygon, bounds, matrixValues);
        } else {
            // Adjust crop rectangle for resize if required
            Common.checkResizeBounds(polygon, bounds, matrixValues, touchPoint);
        }

        // Check if the crop rectangle is not crossing image's bound
        return this.polygon;
    }

    private void moveCorner(Float diffX, Float diffY, int touchPoint) {
        this.polygon.points[touchPoint].x += diffX;
        this.polygon.points[touchPoint].y += diffY;
    }

//    private void moveEdgeTop(Float diffY) {
//        // DO THIS FOR EVERY METHOD THAT MODIFIES SIZE OF CROP RECTANGLE
//        // TODO: Write code to prevent too small width or height
//        // TODO: Write code to make check if not translated out of bounds
//        rectF.top += diffY;
//    }
//
//    private void moveEdgeLeft(Float diffX) {
//        rectF.left += diffX;
//    }
//
//    private void moveEdgeBottom(Float diffY) {
//        rectF.bottom += diffY;
//    }
//
//    private void moveEdgeRight(Float diffX) {
//        rectF.right += diffX;
//    }
//
//    private void moveHandleRB(float diffX, float diffY) {
//        rectF.right += diffX;
//        rectF.bottom += diffY;
//        if (isWidthTooSmall()) {
//            float offsetX = mMinFrameSize - frameW
//            rectF.right += offsetX
//        }
//        if (isHeightTooSmall()) {
//            val offsetY = mMinFrameSize - frameH
//            rectF.bottom += offsetY
//        }
//            checkScaleBounds()
//    }

//    private void moveHandleLB(float diffX, float diffY) {
//        rectF.left += diffX;
//        rectF.bottom += diffY;
//    }
//
//    private void moveHandleRT(float diffX, float diffY) {
//        rectF.right += diffX;
//        rectF.top += diffY;
//    }
//
//    private void moveHandleLT(float diffX, float diffY) {
//        rectF.left += diffX;
//        rectF.top += diffY;
//    }

    private void moveFrame(float diffX, float diffY) {
        for (PointF point: polygon.points) {
            point.x += diffX;
            point.y += diffY;
        }
    }

}
