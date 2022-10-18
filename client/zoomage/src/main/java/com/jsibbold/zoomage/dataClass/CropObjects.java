package com.jsibbold.zoomage.dataClass;

import java.util.LinkedHashMap;

/**
 * This class is meant for holding different mappings of crop objects
 */
public class CropObjects {
    public LinkedHashMap<String, RectFData> rectFMap;
    public LinkedHashMap<String, PolygonData> polygonMap;

    public CropObjects(
            LinkedHashMap<String, RectFData> rectFMap,
            LinkedHashMap<String, PolygonData> polygonMap) {
        this.rectFMap = rectFMap;
        this.polygonMap = polygonMap;
    }
}
