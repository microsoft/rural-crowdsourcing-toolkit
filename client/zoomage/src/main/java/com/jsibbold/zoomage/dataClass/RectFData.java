package com.jsibbold.zoomage.dataClass;

import android.graphics.RectF;

/**
 * Class to hold all the data necessary to draw a crop rectangle in the image annotation canvas
 */
public class RectFData extends CropObjectData {
    public RectF rectF;

    public RectFData(RectF rectF, int color) {
        this.rectF = rectF;
        this.color = color;
        this.locked = false;
    }
}
