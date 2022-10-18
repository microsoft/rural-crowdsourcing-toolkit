package com.jsibbold.zoomage.utils.Rectangle;

import android.graphics.Matrix;
import android.util.Pair;

import com.jsibbold.zoomage.dataClass.RectFData;
import com.jsibbold.zoomage.enums.TouchArea;

import java.util.LinkedHashMap;

public class TouchUtils {
    // The rectangle to check the touch area for
    private LinkedHashMap<String, RectFData> rectFs;
    // Matrix of the canvas
    private Float sX, sY, tX, tY;
    private String currentId = null;
    float threshold = 64*32;

    // initialise variables
    public TouchUtils(LinkedHashMap<String, RectFData> rectFs, float[] matrixValues) {
        this.rectFs = rectFs;
        sX = matrixValues[Matrix.MSCALE_X];
        sY = matrixValues[Matrix.MSCALE_Y];
        tX = matrixValues[Matrix.MTRANS_X];
        tY = matrixValues[Matrix.MTRANS_Y];
    }

    public Pair<String, TouchArea> checkTouchArea(Float focusX, Float focusY) {
        TouchArea currentTouchArea = TouchArea.OUT_OF_BOUNDS;

        if (isInsideCornerLeftTop(focusX, focusY)) {
            currentTouchArea = TouchArea.LEFT_TOP;
        }
        else if (isInsideCornerRightTop(focusX, focusY)) {
            currentTouchArea = TouchArea.RIGHT_TOP;
        }
        else if (isInsideCornerLeftBottom(focusX, focusY)) {
            currentTouchArea = TouchArea.LEFT_BOTTOM;
        }
        else if (isInsideCornerRightBottom(focusX, focusY)) {
            currentTouchArea = TouchArea.RIGHT_BOTTOM;
        }
        else if (isInsideFrame(focusX, focusY)) {
            currentTouchArea = TouchArea.CENTER;
        }
        else if (isOnTopEdge(focusX, focusY)) {
            currentTouchArea = TouchArea.TOP_EDGE;
        }
        else if (isOnLeftEdge(focusX, focusY)) {
            currentTouchArea = TouchArea.LEFT_EDGE;
        }

        else if (isOnBottomEdge(focusX, focusY)) {
            currentTouchArea = TouchArea.BOTTOM_EDGE;
        }

        else if (isOnRightEdge(focusX, focusY)) {
            currentTouchArea = TouchArea.RIGHT_EDGE;
        }

        return new Pair(currentId, currentTouchArea);
    }

    private Boolean isInsideFrame(Float focusx, Float focusy) {
        for(String id : rectFs.keySet()) {
            if (scaleAndTranslateX(rectFs.get(id).rectF.left) <= focusx && scaleAndTranslateX(rectFs.get(id).rectF.right) >= focusx) {
                if (scaleAndTranslateY(rectFs.get(id).rectF.top) <= focusy && scaleAndTranslateY(rectFs.get(id).rectF.bottom) >= focusy) {
                    currentId = id;
                }
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isInsideCornerLeftTop(Float focusx, Float focusy) {
        for(String id : rectFs.keySet()) {
            // Scaling and translating since we need user's viewpoint of the crop rectangle
            float dx = focusx - scaleAndTranslateX(rectFs.get(id).rectF.left);
            float dy = focusy - scaleAndTranslateY(rectFs.get(id).rectF.top);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isInsideCornerRightTop(Float focusx, Float focusy) {
        for(String id : rectFs.keySet()) {
            // Scaling and translating since we need user's viewpoint of the crop rectangle
            float dx = focusx - scaleAndTranslateX(rectFs.get(id).rectF.right);
            float dy = focusy - scaleAndTranslateY(rectFs.get(id).rectF.top);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isInsideCornerLeftBottom(Float focusx, Float focusy) {
        for(String id : rectFs.keySet()) {
            // Scaling and translating since we need user's viewpoint of the crop rectangle
            float dx = focusx - scaleAndTranslateX(rectFs.get(id).rectF.left);
            float dy = focusy - scaleAndTranslateY(rectFs.get(id).rectF.bottom);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isInsideCornerRightBottom(Float focusx, Float focusy) {
        for(String id : rectFs.keySet()) {
            // Scaling and translating since we need user's viewpoint of the crop rectangle
            float dx = focusx - scaleAndTranslateX(rectFs.get(id).rectF.right);
            float dy = focusy - scaleAndTranslateY(rectFs.get(id).rectF.bottom);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isOnTopEdge(Float focusx, Float focusy) {
        for(String id : rectFs.keySet()) {
            float dx = focusx - scaleAndTranslateX((rectFs.get(id).rectF.left + rectFs.get(id).rectF.right) / 2);
            float dy = focusy - scaleAndTranslateY(rectFs.get(id).rectF.top);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isOnLeftEdge(Float x, Float y) {
        for(String id : rectFs.keySet()) {
            float dx = x - scaleAndTranslateX(rectFs.get(id).rectF.left);
            float dy = y - scaleAndTranslateY((rectFs.get(id).rectF.top + rectFs.get(id).rectF.bottom) / 2);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isOnBottomEdge(Float x, Float y) {
        for(String id : rectFs.keySet()) {
            float dx = x - scaleAndTranslateX((rectFs.get(id).rectF.left + rectFs.get(id).rectF.right) / 2);
            float dy = y - scaleAndTranslateY(rectFs.get(id).rectF.bottom);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Boolean isOnRightEdge(Float x, Float y) {
        for(String id : rectFs.keySet()) {
            float dx = x - scaleAndTranslateX(rectFs.get(id).rectF.right);
            float dy = y - scaleAndTranslateY((rectFs.get(id).rectF.top + rectFs.get(id).rectF.bottom) / 2);
            float d = dx * dx + dy * dy;

            if (threshold >= d) {
                currentId = id;
            }
        }
        // Return true if current id has been assigned a value, return false otherwise
        return currentId != null;
    }

    private Float scaleAndTranslateX(Float x) {
        return x * sX + tX;
    }

    private Float scaleAndTranslateY(Float y) {
        return y * sY + tY;
    }

}
