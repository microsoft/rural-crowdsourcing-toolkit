package com.jsibbold.zoomage.utils.Polygon;

import android.graphics.Matrix;
import android.graphics.PointF;
import android.graphics.RectF;

import com.jsibbold.zoomage.dataClass.Polygon;

public class Common {

    public static Polygon checkResizeBounds(Polygon polygon, RectF bounds, float[] matrixValues, int touchPoint) {
        float lDiff = 0, rDiff = 0, tDiff = 0, bDiff = 0;

        PointF point = polygon.points[touchPoint];
        lDiff = scaleAndTranslateX(point.x, matrixValues) - bounds.left;
        rDiff = scaleAndTranslateX(point.x, matrixValues) - bounds.right;
        tDiff = scaleAndTranslateY(point.y, matrixValues) - bounds.top;
        bDiff = scaleAndTranslateY(point.y, matrixValues) - bounds.bottom;

        if (lDiff < 0) {
            point.x -= lDiff;
        }
        if (rDiff > 0) {
            point.x -= rDiff;
        }
        if (tDiff < 0) {
            point.y -= tDiff;
        }
        if (bDiff > 0) {
            point.y -= bDiff;
        }

        return polygon;
    }

    public static Polygon checkMoveBounds(Polygon polygon, RectF bounds, float[] matrixValues) {

        float lDiff = 0, rDiff = 0, tDiff = 0, bDiff = 0;

        for (PointF point : polygon.points) {
            lDiff = scaleAndTranslateX(point.x, matrixValues) - bounds.left;
            rDiff = scaleAndTranslateX(point.x, matrixValues) - bounds.right;
            tDiff = scaleAndTranslateY(point.y, matrixValues) - bounds.top;
            bDiff = scaleAndTranslateY(point.y, matrixValues) - bounds.bottom;

            if (lDiff < 0) {
                for (PointF p : polygon.points) {
                    p.x -= lDiff;
                }
            }
            if (rDiff > 0) {
                for (PointF p : polygon.points) {
                    p.x -= rDiff;
                }
            }
            if (tDiff < 0) {
                for (PointF p : polygon.points) {
                    p.y -= tDiff;
                }
            }
            if (bDiff > 0) {
                for (PointF p : polygon.points) {
                    p.y -= bDiff;
                }
            }

        }

        return polygon;
    }

    public static float scaleAndTranslateX(float x, float[] matrixValues) {
        return x * matrixValues[Matrix.MSCALE_X] + matrixValues[Matrix.MTRANS_X];
    }

    public static float scaleAndTranslateY(float y, float[] matrixValues) {
        return y * matrixValues[Matrix.MSCALE_Y] + matrixValues[Matrix.MTRANS_Y];
    }
}
