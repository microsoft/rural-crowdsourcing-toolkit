package com.jsibbold.zoomage.utils.Polygon;

import android.graphics.Matrix;
import android.graphics.PointF;
import android.util.Pair;

import com.jsibbold.zoomage.dataClass.PolygonData;
import com.snatik.polygon.Point;
import com.snatik.polygon.Polygon;

import java.util.LinkedHashMap;

public class TouchUtils {
    public static final int NONE = -3;
    public static final int OUT_OF_BOUNDS = -2;
    public static final int INSIDE_POLYGON = -1;
    // The rectangle to check the touch area for
    private LinkedHashMap<String, PolygonData> polygonMap;
    // Matrix of the canvas
    private Float sX, sY, tX, tY;
    private String currentId = null;
    float threshold = 256*200;

    // initialise variables
    public TouchUtils(LinkedHashMap<String, PolygonData> polygonMap, float[] matrixValues) {
        this.polygonMap = polygonMap;
        sX = matrixValues[Matrix.MSCALE_X];
        sY = matrixValues[Matrix.MSCALE_Y];
        tX = matrixValues[Matrix.MTRANS_X];
        tY = matrixValues[Matrix.MTRANS_Y];
    }

    public Pair<String, Integer> checkTouchArea(Float focusX, Float focusY, String lastFocusId) {

        // Check if focusedCropId exists
        if (polygonMap.containsKey(lastFocusId)) {
            // First check for the polygon that was last touched
            Pair<String, Integer> touchForLastPolygon = checkPolygonForTouch(lastFocusId, focusX, focusY);
            if(touchForLastPolygon != null) {
                return touchForLastPolygon;
            }
        }

        // Iterating through each polygon to determine touch area
        for (String id: polygonMap.keySet()) {
            Pair<String, Integer> touchResult = checkPolygonForTouch(id, focusX, focusY);
            if(touchResult != null) {
                return touchResult;
            }
        }

        // Cannot find any polygon with any touch area
        return new Pair<>(null, OUT_OF_BOUNDS);
    }

    private Pair<String, Integer> checkPolygonForTouch(String id, Float focusX, Float focusY) {
        // Determine whether the touch area is inside this polygon
        Pair<String, Integer> insideTouch = checkTouchInsidePolygon(id, focusX, focusY);
        if (insideTouch != null) {
            return insideTouch;
        }
        // Determine whether the touch area is on the corner of polygon
        Pair<String, Integer> cornerTouch = checkPolygonCornerTouch(id, focusX, focusY);
        if (cornerTouch != null) {
            return cornerTouch;
        }
        return null;
    }

    private Pair<String, Integer> checkTouchInsidePolygon(String id, Float focusX, Float focusY) {
        PolygonData polygonData = polygonMap.get(id);
        PointF[] points = polygonData.polygon.points;
        // Use Polygon's library method to build polygon object
        Polygon.Builder builder = Polygon.Builder();
        for (PointF point: points) {
            builder.addVertex(new Point(
                    scaleAndTranslateX(point.x),
                    scaleAndTranslateY(point.y)));
        }
        Polygon polygon = builder.build();
        boolean contains = polygon.contains(new Point(focusX, focusY));
        if (contains) return new Pair<String, Integer>(id, INSIDE_POLYGON);
        return null;
    }

    private Pair<String, Integer> checkPolygonCornerTouch(String id, Float focusX, Float focusY) {
        PolygonData polygonData = polygonMap.get(id);
        PointF[] points = polygonData.polygon.points;
        // Iterating through polygon corners to determine touch area
        for (int i=0; i < points.length; i++) {
            PointF point = points[i];
            // Scaling and translating since we need user's viewpoint of the crop polygon
            float dx = focusX - scaleAndTranslateX(point.x);
            float dy = focusY - scaleAndTranslateY(point.y);
            float d = dx * dx + dy * dy;
            if (threshold >= d) {
                return new Pair<String, Integer>(id, i);
            }
        }
        return null;
    }

    private Float scaleAndTranslateX(Float x) {
        return x * sX + tX;
    }

    private Float scaleAndTranslateY(Float y) {
        return y * sY + tY;
    }

}
