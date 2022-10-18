package com.jsibbold.zoomage.utils.Rectangle;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.RectF;

import com.jsibbold.zoomage.dataClass.RectFData;
import com.jsibbold.zoomage.enums.CropObjectStatus;

public class DrawUtils {

    /**
     * Draw Rectangle on the canvas
     *
     * @param canvas       The canvas to which the rectangle will be drawn
     * @param matrixValues The matrix values of the canvas after transformation, this will allow the rectangle to be translated and scaled
     * @param rectFData    RectFdata for the rectangle to be drawn on canvas
     * @param drawHandles  Whether to draw handles for the rectangle
     */
    public static void drawRect(
            Canvas canvas, float[] matrixValues,
            RectFData rectFData,
            Boolean drawHandles
    ) {

        Paint myPaint = new Paint();
        myPaint.setAntiAlias(true);
        myPaint.setFilterBitmap(true);
        // TODO: MAKE THIS PROPERTY PARAMETER
        myPaint.setStrokeWidth(8);
        myPaint.setColor(rectFData.color);
        myPaint.setStrokeWidth(10);

        if (rectFData.status == CropObjectStatus.INACTIVE) {
            // Deactivate handles if the crop object is inactive
            drawHandles = false;
        }

        if (drawHandles) {
            drawHandles(canvas, matrixValues, rectFData, 16, myPaint);
            drawEdgeDots(canvas, matrixValues, rectFData, 16, myPaint);
        }

        // Change the paint style to stroke
        myPaint.setStyle(Paint.Style.STROKE);
        // Draw the rectangle
        canvas.drawRect(
                Common.scaleAndTranslateX(rectFData.rectF.left, matrixValues),
                Common.scaleAndTranslateY(rectFData.rectF.top, matrixValues),
                Common.scaleAndTranslateX(rectFData.rectF.right, matrixValues),
                Common.scaleAndTranslateY(rectFData.rectF.bottom, matrixValues),
                myPaint
        );
    }

    /**
     * Draw Handles (Corner circles) for the rectangle drawn on Canvas
     *
     * @param canvas
     * @param matrixValues
     * @param rectFData
     * @param myPaint
     */
    private static void drawHandles(Canvas canvas, float[] matrixValues, RectFData rectFData, float handleSize, Paint myPaint) {

        float sX = matrixValues[Matrix.MSCALE_X];
        float sY = matrixValues[Matrix.MSCALE_Y];
        float tX = matrixValues[Matrix.MTRANS_X];
        float tY = matrixValues[Matrix.MTRANS_Y];

        myPaint.setStyle(Paint.Style.FILL);
        canvas.drawCircle(rectFData.rectF.left * sX + tX,
                rectFData.rectF.top * sY + tY, handleSize, myPaint);
        canvas.drawCircle(rectFData.rectF.right * sX + tX,
                rectFData.rectF.top * sY + tY, handleSize, myPaint);
        canvas.drawCircle(rectFData.rectF.left * sX + tX,
                rectFData.rectF.bottom * sY + tY, handleSize, myPaint);
        canvas.drawCircle(rectFData.rectF.right * sX + tX,
                rectFData.rectF.bottom * sY + tY, handleSize, myPaint);
    }

    /**
     * Draw Edge Dots on the crop rectangles
     * @param canvas
     * @param matrixValues
     * @param rectFData
     * @param handleSize
     * @param myPaint
     */
    private static void drawEdgeDots(Canvas canvas, float[] matrixValues, RectFData rectFData, int handleSize, Paint myPaint) {

        RectF scaledAndTranslated = new RectF(
                Common.scaleAndTranslateX(rectFData.rectF.left, matrixValues),
                Common.scaleAndTranslateY(rectFData.rectF.top, matrixValues),
                Common.scaleAndTranslateX(rectFData.rectF.right, matrixValues),
                Common.scaleAndTranslateY(rectFData.rectF.bottom, matrixValues)
        );

        // Calculate the center point for each edge dot (w.r.t the scaled and translated canvas)
        PointF topEdgeCenter = new PointF((scaledAndTranslated.left + scaledAndTranslated.right) / 2, scaledAndTranslated.top);
        PointF leftEdgeCenter = new PointF(scaledAndTranslated.left, (scaledAndTranslated.top + scaledAndTranslated.bottom) / 2);
        PointF bottomEdgeCenter = new PointF((scaledAndTranslated.left + scaledAndTranslated.right) / 2, scaledAndTranslated.bottom);
        PointF rightEdgeCenter = new PointF(scaledAndTranslated.right, (scaledAndTranslated.top + scaledAndTranslated.bottom) / 2);

        RectF topEdgeRect = new RectF(
                topEdgeCenter.x - handleSize,
                topEdgeCenter.y - handleSize,
                topEdgeCenter.x + handleSize,
                topEdgeCenter.y + handleSize
        );

        RectF leftEdgeRect = new RectF(
                leftEdgeCenter.x - handleSize,
                leftEdgeCenter.y - handleSize,
                leftEdgeCenter.x + handleSize,
                leftEdgeCenter.y + handleSize
        );

        RectF bottomEdgeRect = new RectF(
                bottomEdgeCenter.x - handleSize,
                bottomEdgeCenter.y - handleSize,
                bottomEdgeCenter.x + handleSize,
                bottomEdgeCenter.y + handleSize
        );

        RectF rightEdgeRect = new RectF(
                rightEdgeCenter.x - handleSize,
                rightEdgeCenter.y - handleSize,
                rightEdgeCenter.x + handleSize,
                rightEdgeCenter.y + handleSize
        );

        // Draw the edge dots
        canvas.drawRect(topEdgeRect, myPaint);
        canvas.drawRect(bottomEdgeRect, myPaint);
        canvas.drawRect(leftEdgeRect, myPaint);
        canvas.drawRect(rightEdgeRect, myPaint);

    }
}
