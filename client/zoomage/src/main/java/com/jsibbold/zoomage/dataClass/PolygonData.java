package com.jsibbold.zoomage.dataClass;

import com.jsibbold.zoomage.enums.CropObjectStatus;

/**
 * Class to hold all the data necessary to draw a polygon in the image annotation canvas
 */
public class PolygonData extends CropObjectData {
    public Polygon polygon;

    /**
     * Holds data necessary to draw a polygon on the canvas
     * @param polygon polygon object for which to hold the data
     * @param color Color of the Polygon
     * @param
     */
    public PolygonData(Polygon polygon, int color, CropObjectStatus status) {
        this.polygon = polygon;
        this.color = color;
        this.locked = false;
        this.status = status;
    }
}
