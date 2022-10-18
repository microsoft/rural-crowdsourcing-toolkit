package com.jsibbold.zoomage.utils.Polygon;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;

import com.jsibbold.zoomage.dataClass.PolygonData;
import com.jsibbold.zoomage.enums.CropObjectStatus;

public class DrawUtils {

    /**
     * Draw Polygon on the canvas
     *
     * @param canvas       The canvas to which the rectangle will be drawn
     * @param matrixValues The matrix values of the canvas after transformation, this will allow the rectangle to be translated and scaled
     * @param polygonData  PolygonData for the polygon to be drawn on canvas
     * @param drawHandles  Whether to draw handles for the polygon
     */
    public static void drawPolygon(
            Canvas canvas, float[] matrixValues,
            PolygonData polygonData,
            Boolean drawHandles
    ) {

        Paint myPaint = new Paint();
        myPaint.setAntiAlias(true);
        myPaint.setFilterBitmap(true);
        // TODO: MAKE THIS PROPERTY PARAMETER
        myPaint.setStrokeWidth(8);
        myPaint.setColor(polygonData.color);
        myPaint.setStrokeWidth(10);

        if (polygonData.status == CropObjectStatus.INACTIVE) {
            // Deactivate handles if the crop object is inactive
            drawHandles = false;
        }

        // TODO: Draw handles
        if (drawHandles) {
            drawHandles(canvas, matrixValues, polygonData, 16, myPaint);
        }

        // Change the paint style to stroke
        myPaint.setStyle(Paint.Style.STROKE);
        // Draw the polygon
        // path
        Path polyPath = new Path();
        PointF[] points = polygonData.polygon.points;
        PointF[] scaledPoints = new PointF[points.length];
        for (int i=0; i<points.length; i++) {
            float x = Common.scaleAndTranslateX(points[i].x, matrixValues);
            float y = Common.scaleAndTranslateY(points[i].y, matrixValues);
            scaledPoints[i] = new PointF(x, y);
        }
        polyPath.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        for (int i=0; i<scaledPoints.length; i++) {
            polyPath.lineTo(scaledPoints[i].x, scaledPoints[i].y);
        }
        polyPath.lineTo(scaledPoints[0].x, scaledPoints[0].y);

        // draw in the canvas
        canvas.drawPath(polyPath, myPaint);
    }

    /**
     * Draw Handles (Corner circles) for the polygon drawn on Canvas
     *
     * @param canvas
     * @param matrixValues
     * @param polygonData
     * @param myPaint
     */
    private static void drawHandles(Canvas canvas, float[] matrixValues, PolygonData polygonData, float handleSize, Paint myPaint) {
        PointF[] points = polygonData.polygon.points;
        // Scale And Translate the points according to the canvas's matrix state
        PointF[] scaledPoints = new PointF[points.length];
        for (int i=0; i<points.length; i++) {
            float x = Common.scaleAndTranslateX(points[i].x, matrixValues);
            float y = Common.scaleAndTranslateY(points[i].y, matrixValues);
            scaledPoints[i] = new PointF(x, y);
        }
        // Draw all the circles
        myPaint.setStyle(Paint.Style.FILL);
        for (PointF scaledPoint : scaledPoints) {
            canvas.drawCircle(scaledPoint.x, scaledPoint.y, handleSize, myPaint);
        }
    }

}
