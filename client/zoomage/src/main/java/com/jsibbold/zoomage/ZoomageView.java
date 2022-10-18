/**
 * Copyright 2016 Jeffrey Sibbold
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.jsibbold.zoomage;

import static com.jsibbold.zoomage.utils.Polygon.DrawUtils.drawPolygon;
import static com.jsibbold.zoomage.utils.Polygon.TouchUtils.NONE;
import static com.jsibbold.zoomage.utils.Polygon.TouchUtils.OUT_OF_BOUNDS;
import static java.lang.Math.min;

import android.animation.Animator;
import android.animation.ValueAnimator;
import android.animation.ValueAnimator.AnimatorUpdateListener;
import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Parcelable;
import android.util.AttributeSet;
import android.util.Pair;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.ScaleGestureDetector.OnScaleGestureListener;
import android.widget.ImageView;

import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatImageView;
import androidx.core.view.ScaleGestureDetectorCompat;

import com.jsibbold.zoomage.dataClass.CropObjectData;
import com.jsibbold.zoomage.dataClass.CropObjects;
import com.jsibbold.zoomage.dataClass.Polygon;
import com.jsibbold.zoomage.dataClass.PolygonData;
import com.jsibbold.zoomage.dataClass.RectFData;
import com.jsibbold.zoomage.enums.CropObjectStatus;
import com.jsibbold.zoomage.enums.TouchArea;
import com.jsibbold.zoomage.interfaces.OnCropPolygonClickListener;
import com.jsibbold.zoomage.interfaces.OnCropRectangleClickListener;
import com.jsibbold.zoomage.utils.Rectangle.Common;
import com.jsibbold.zoomage.utils.Rectangle.DrawUtils;
import com.jsibbold.zoomage.utils.Rectangle.TouchUtils;
import com.jsibbold.zoomage.utils.Rectangle.TranslateUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;

/**
 * ZoomageView is a pinch-to-zoom extension of {@link ImageView}, providing a smooth
 * user experience and a very natural feel when zooming and translating. It also supports
 * automatic resetting, and allows for exterior bounds restriction to keep the image within
 * visible window.
 */
public class ZoomageView extends AppCompatImageView implements OnScaleGestureListener {

    private static final float MIN_SCALE = 0.6f;
    private static final float MAX_SCALE = 8f;
    private final int RESET_DURATION = 200;

    private ScaleType startScaleType;

    // These matrices will be used to move and zoom image
    private Matrix matrix = new Matrix();
    private Matrix startMatrix = new Matrix();

    private float[] matrixValues = new float[9];
    private float[] startValues = null;

    private float minScale = MIN_SCALE;
    private float maxScale = MAX_SCALE;

    // Default Values for min crop rectangle length and height
    private float minCropRecHeight = 10;
    private float minCropRecWidth = 10;

    //the adjusted scale bounds that account for an image's starting scale values
    private float calculatedMinScale = MIN_SCALE;
    private float calculatedMaxScale = MAX_SCALE;

    private final RectF bounds = new RectF();

    private boolean translatable;
    private boolean zoomable;
    private boolean doubleTapToZoom;
    private boolean restrictBounds;
    private boolean animateOnReset;
    private boolean autoCenter;
    private float doubleTapToZoomScaleFactor;
    @AutoResetMode
    private int autoResetMode;

    private PointF last = new PointF(0, 0);
    private float startScale = 1f;
    private float scaleBy = 1f;
    private float currentScaleFactor = 1f;
    private int previousPointerCount = 1;
    private int currentPointerCount = 0;

    private ScaleGestureDetector scaleDetector;
    private ValueAnimator resetAnimator;

    private GestureDetector gestureDetector;
    private boolean doubleTapDetected = false;
    private boolean singleTapDetected = false;

    // Anurag's custom variables
    RectF rectF = new RectF(100, 100, 300, 300);
    private TouchArea currentRectangleTouchArea;
    private int currentPolygonTouchArea = NONE;
    String focusedCropId = null;
    private final CropObjects cropObjects = new CropObjects(new LinkedHashMap<>(), new LinkedHashMap<>());
    private final LinkedHashMap<String, RectFData> cropRectFMap = cropObjects.rectFMap;
    private final LinkedHashMap<String, PolygonData> polygonMap = cropObjects.polygonMap;
    private boolean resetImage = false;
    private int translucentColor = -0x99000000;

    OnCropRectangleClickListener cropRectangleClickListener;
    OnCropPolygonClickListener cropPolygonClickListener;

    public ZoomageView(Context context) {
        super(context);
        init(context, null);
    }

    public ZoomageView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context, attrs);
    }

    public ZoomageView(Context context, AttributeSet attrs, int defStyle) {
        super(context, attrs, defStyle);
        init(context, attrs);
    }

    private void init(Context context, AttributeSet attrs) {
        scaleDetector = new ScaleGestureDetector(context, this);
        gestureDetector = new GestureDetector(context, gestureListener);
        ScaleGestureDetectorCompat.setQuickScaleEnabled(scaleDetector, false);
        startScaleType = getScaleType();

        TypedArray values = context.obtainStyledAttributes(attrs, R.styleable.ZoomageView);

        zoomable = values.getBoolean(R.styleable.ZoomageView_zoomage_zoomable, true);
        translatable = values.getBoolean(R.styleable.ZoomageView_zoomage_translatable, true);
        animateOnReset = values.getBoolean(R.styleable.ZoomageView_zoomage_animateOnReset, true);
        autoCenter = values.getBoolean(R.styleable.ZoomageView_zoomage_autoCenter, true);
        restrictBounds = values.getBoolean(R.styleable.ZoomageView_zoomage_restrictBounds, false);
        doubleTapToZoom = values.getBoolean(R.styleable.ZoomageView_zoomage_doubleTapToZoom, true);
        minScale = values.getFloat(R.styleable.ZoomageView_zoomage_minScale, MIN_SCALE);
        maxScale = values.getFloat(R.styleable.ZoomageView_zoomage_maxScale, MAX_SCALE);
        Common.minHeight = values.getFloat(R.styleable.ZoomageView_zoomage_minCropRecHeight, minCropRecHeight);
        Common.minWidth = values.getFloat(R.styleable.ZoomageView_zoomage_minCropRecWidth, minCropRecWidth);
        doubleTapToZoomScaleFactor = values.getFloat(R.styleable.ZoomageView_zoomage_doubleTapToZoomScaleFactor, 3);
        autoResetMode = AutoResetMode.Parser.fromInt(values.getInt(R.styleable.ZoomageView_zoomage_autoResetMode, AutoResetMode.UNDER));

        verifyScaleRange();

        values.recycle();
    }

    @Nullable
    @Override
    protected Parcelable onSaveInstanceState() {
        return super.onSaveInstanceState();
    }

    private void verifyScaleRange() {
        if (minScale >= maxScale) {
            throw new IllegalStateException("minScale must be less than maxScale");
        }

        if (minScale < 0) {
            throw new IllegalStateException("minScale must be greater than 0");
        }

        if (maxScale < 0) {
            throw new IllegalStateException("maxScale must be greater than 0");
        }

        if (doubleTapToZoomScaleFactor > maxScale) {
            doubleTapToZoomScaleFactor = maxScale;
        }

        if (doubleTapToZoomScaleFactor < minScale) {
            doubleTapToZoomScaleFactor = minScale;
        }
    }

    /**
     * Set the minimum and maximum allowed scale for zooming. {@code minScale} cannot
     * be greater than {@code maxScale} and neither can be 0 or less. This will result
     * in an {@link IllegalStateException}.
     *
     * @param minScale minimum allowed scale
     * @param maxScale maximum allowed scale
     */
    public void setScaleRange(final float minScale, final float maxScale) {
        this.minScale = minScale;
        this.maxScale = maxScale;

        startValues = null;

        verifyScaleRange();
    }

    /**
     * Returns whether the image is translatable.
     *
     * @return true if translation of image is allowed, false otherwise
     */
    public boolean isTranslatable() {
        return translatable;
    }

    /**
     * Set the image's translatable state.
     *
     * @param translatable true to enable translation, false to disable it
     */
    public void setTranslatable(boolean translatable) {
        this.translatable = translatable;
    }

    /**
     * Returns the zoomable state of the image.
     *
     * @return true if pinch-zooming of the image is allowed, false otherwise.
     */
    public boolean isZoomable() {
        return zoomable;
    }

    /**
     * Set the zoomable state of the image.
     *
     * @param zoomable true to enable pinch-zooming of the image, false to disable it
     */
    public void setZoomable(final boolean zoomable) {
        this.zoomable = zoomable;
    }

    /**
     * If restricted bounds are enabled, the image will not be allowed to translate
     * farther inward than the edges of the view's bounds, unless the corresponding
     * dimension (width or height) is smaller than those of the view's frame.
     *
     * @return true if image bounds are restricted to the view's edges, false otherwise
     */
    public boolean getRestrictBounds() {
        return restrictBounds;
    }

    /**
     * Set the restrictBounds status of the image.
     * If restricted bounds are enabled, the image will not be allowed to translate
     * farther inward than the edges of the view's bounds, unless the corresponding
     * dimension (width or height) is smaller than those of the view's frame.
     *
     * @param restrictBounds true if image bounds should be restricted to the view's edges, false otherwise
     */
    public void setRestrictBounds(final boolean restrictBounds) {
        this.restrictBounds = restrictBounds;
    }

    /**
     * Returns status of animateOnReset. This causes the image to smoothly animate back
     * to its start position when reset. Default value is true.
     *
     * @return true if animateOnReset is enabled, false otherwise
     */
    public boolean getAnimateOnReset() {
        return animateOnReset;
    }

    /**
     * Set whether or not the image should animate when resetting.
     *
     * @param animateOnReset true if image should animate when resetting, false to snap
     */
    public void setAnimateOnReset(final boolean animateOnReset) {
        this.animateOnReset = animateOnReset;
    }

    /**
     * Get the current {@link AutoResetMode} mode of the image. Default value is {@link AutoResetMode#UNDER}.
     *
     * @return the current {@link AutoResetMode} mode, one of {@link AutoResetMode#OVER OVER}, {@link AutoResetMode#UNDER UNDER},
     * {@link AutoResetMode#ALWAYS ALWAYS}, or {@link AutoResetMode#NEVER NEVER}
     */
    @AutoResetMode
    public int getAutoResetMode() {
        return autoResetMode;
    }

    /**
     * Set the {@link AutoResetMode} mode for the image.
     *
     * @param autoReset the desired mode, one of {@link AutoResetMode#OVER OVER}, {@link AutoResetMode#UNDER UNDER},
     *                  {@link AutoResetMode#ALWAYS ALWAYS}, or {@link AutoResetMode#NEVER NEVER}
     */
    public void setAutoResetMode(@AutoResetMode final int autoReset) {
        this.autoResetMode = autoReset;
    }

    /**
     * Whether or not the image should automatically center itself when it's dragged partially or
     * fully out of view.
     *
     * @return true if image should center itself automatically, false if it should not
     */
    public boolean getAutoCenter() {
        return autoCenter;
    }

    /**
     * Set whether or not the image should automatically center itself when it's dragged
     * partially or fully out of view.
     *
     * @param autoCenter true if image should center itself automatically, false if it should not
     */
    public void setAutoCenter(final boolean autoCenter) {
        this.autoCenter = autoCenter;
    }

    /**
     * Gets double tap to zoom state.
     *
     * @return whether double tap to zoom is enabled
     */
    public boolean getDoubleTapToZoom() {
        return doubleTapToZoom;
    }

    /**
     * Sets double tap to zoom state.
     *
     * @param doubleTapToZoom true if double tap to zoom should be enabled
     */
    public void setDoubleTapToZoom(boolean doubleTapToZoom) {
        this.doubleTapToZoom = doubleTapToZoom;
    }

    /**
     * Gets the double tap to zoom scale factor.
     *
     * @return double tap to zoom scale factor
     */
    public float getDoubleTapToZoomScaleFactor() {
        return doubleTapToZoomScaleFactor;
    }

    /**
     * Sets the double tap to zoom scale factor. Can be a maximum of max scale.
     *
     * @param doubleTapToZoomScaleFactor the scale factor you want to zoom to when double tap occurs
     */
    public void setDoubleTapToZoomScaleFactor(float doubleTapToZoomScaleFactor) {
        this.doubleTapToZoomScaleFactor = doubleTapToZoomScaleFactor;
        verifyScaleRange();
    }

    /**
     * Get the current scale factor of the image, in relation to its starting size.
     *
     * @return the current scale factor
     */
    public float getCurrentScaleFactor() {
        return currentScaleFactor;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setScaleType(@Nullable ScaleType scaleType) {
        if (scaleType != null) {
            super.setScaleType(scaleType);
            startScaleType = scaleType;
            startValues = null;
        }
    }

    /**
     * Set enabled state of the view. Note that this will reset the image's
     * {@link android.widget.ImageView.ScaleType} to its pre-zoom state.
     *
     * @param enabled enabled state
     */
    @Override
    public void setEnabled(final boolean enabled) {
        super.setEnabled(enabled);

        if (!enabled) {
            setScaleType(startScaleType);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setImageResource(int resId) {
        super.setImageResource(resId);
        setScaleType(startScaleType);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setImageDrawable(@Nullable Drawable drawable) {
        super.setImageDrawable(drawable);
        setScaleType(startScaleType);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setImageBitmap(Bitmap bm) {
        super.setImageBitmap(bm);
        setScaleType(startScaleType);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setImageURI(@Nullable Uri uri) {
        super.setImageURI(uri);
        setScaleType(startScaleType);
    }

    /**
     * Update the bounds of the displayed image based on the current matrix.
     *
     * @param values the image's current matrix values.
     */
    private void updateBounds(float[] values) {
        if (resetImage) {
            values = startValues;
        }
        if (getDrawable() != null) {
            bounds.set(values[Matrix.MTRANS_X],
                    values[Matrix.MTRANS_Y],
                    getDrawable().getIntrinsicWidth() * values[Matrix.MSCALE_X] + values[Matrix.MTRANS_X],
                    getDrawable().getIntrinsicHeight() * values[Matrix.MSCALE_Y] + values[Matrix.MTRANS_Y]);
        }
    }

    /**
     * Get the width of the displayed image.
     *
     * @return the current width of the image as displayed (not the width of the {@link ImageView} itself.
     */
    private float getCurrentDisplayedWidth() {
        if (getDrawable() != null)
            return getDrawable().getIntrinsicWidth() * matrixValues[Matrix.MSCALE_X];
        else
            return 0;
    }

    /**
     * Get the height of the displayed image.
     *
     * @return the current height of the image as displayed (not the height of the {@link ImageView} itself.
     */
    private float getCurrentDisplayedHeight() {
        if (getDrawable() != null)
            return getDrawable().getIntrinsicHeight() * matrixValues[Matrix.MSCALE_Y];
        else
            return 0;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        matrix.setValues(matrixValues);
        updateBounds(matrixValues);
        drawOverlay(canvas);
        redrawCropObjects(canvas);
    }

    /**
     * Draw Overlay on the canvas
     *
     * @param canvas
     */
    private void drawOverlay(Canvas canvas) {
        Paint paintTranslucent = new Paint();
        paintTranslucent.setAntiAlias(true);
        paintTranslucent.setFilterBitmap(true);
        paintTranslucent.setColor(translucentColor);
        paintTranslucent.setStyle(Paint.Style.FILL);
        Path path = new Path();
        RectF overlayRect = new RectF(
                bounds.left,
                bounds.top,
                bounds.right,
                bounds.bottom
        );

        path.addRect(overlayRect, Path.Direction.CW);

        // Draw Overlay for crop rectangle
        if(focusedCropId != null
                && cropRectFMap.size() > 0) {
            RectFData rectFData = cropRectFMap.get(focusedCropId);
            RectF rectF = rectFData.rectF;
            RectF scaledRectF = new RectF(
                    Common.scaleAndTranslateX(rectF.left, matrixValues),
                    Common.scaleAndTranslateY(rectF.top, matrixValues),
                    Common.scaleAndTranslateX(rectF.right, matrixValues),
                    Common.scaleAndTranslateY(rectF.bottom, matrixValues)
            );
            path.addRect(scaledRectF, Path.Direction.CCW);
        }

        if (polygonMap.size() > 0){
            focusedCropId = polygonMap.keySet().iterator().next();
        }


        // Draw overlay for inactive polygons

        for (String key: polygonMap.keySet()) {
            PolygonData polygonData = polygonMap.get(key);
            if (polygonData.status == CropObjectStatus.INACTIVE) {
                if (focusedCropId == null || !focusedCropId.equals(key)) {
                    // Draw path only for objects that are not active
                    path = drawPathForPolygon(polygonData, path);
                }
            }
        }

        // Draw overlay for crop polygon
        if(focusedCropId != null
                && polygonMap.size() > 0) {
            PolygonData polygonData = polygonMap.get(focusedCropId);
            path = drawPathForPolygon(polygonData, path);
        }
        canvas.drawPath(path, paintTranslucent);
    }

    public Path drawPathForPolygon(PolygonData polygonData, Path path) {
        PointF[] points = polygonData.polygon.points;
        PointF[] scaledPoints = new PointF[points.length];
        for (int i = 0; i < points.length; i++) {
            float x = Common.scaleAndTranslateX(points[i].x, matrixValues);
            float y = Common.scaleAndTranslateY(points[i].y, matrixValues);
            scaledPoints[i] = new PointF(x, y);
        }
        path.moveTo(scaledPoints[0].x, scaledPoints[0].y);
        for (PointF scaledPoint : scaledPoints) {
            path.lineTo(scaledPoint.x, scaledPoint.y);
        }
        path.moveTo(points[0].x, points[0].y);
        return path;
    }

    /**
     * Redraw crop objects on the canvas
     *
     * @param canvas
     */
    private void redrawCropObjects(Canvas canvas) {
        for (String id : cropRectFMap.keySet()) {
            float[] values = matrixValues;
            if (resetImage) {
                values = startValues;
            }
            // Only Draw handle for focused Rectangle
            // We only have one variable for storing focused id
            // across all crop objects because we assume there is going to be one
            // type of crop object drawn in the canvas at a time.
            DrawUtils.drawRect(canvas, values, cropRectFMap.get(id), id.equals(focusedCropId));
        }

        if (polygonMap.size() > 0){
            focusedCropId = polygonMap.keySet().iterator().next();
        }

        for (String id : polygonMap.keySet()) {
            float[] values = matrixValues;
            if (resetImage) {
                values = startValues;
            }
            // Only Draw handle for focused Rectangle
            drawPolygon(canvas, values, polygonMap.get(id), id.equals(focusedCropId));
        }
    }

    /**
     * Add Crop Rectangle in the canvas
     *
     * @param id    Unique Id of the crop rectangle to be added
     * @param color Color of the crop rectangle to be added
     */
    public void addCropRectangle(String id, int color) {
        if (startValues == null) {
            setStartValues();
        }
        // Check if Id is unique
        if (cropRectFMap.containsKey(id)) {
            throw new IllegalArgumentException("Crop rectangle with provided ID: " + id + "already exists");
        }
        // Calculate edge length according to visible screen to user
        float rel_sx = matrixValues[Matrix.MSCALE_X] / startValues[Matrix.MSCALE_X];
        float rel_sy = matrixValues[Matrix.MSCALE_Y] / startValues[Matrix.MSCALE_Y];

        float width = getDrawable().getIntrinsicWidth() / (2 * rel_sx);
        float height = getDrawable().getIntrinsicHeight() / (2 * rel_sy);

        PointF center = getScreenCenterCoors();
        // Take the minimum of height and width to be the edge length
        float edgeL = min(height, width);
        RectF newRectF = Common.checkMoveBounds(new RectF(
                        center.x - edgeL / 2, center.y - edgeL / 2, center.x + edgeL / 2, center.y + edgeL / 2),
                bounds, matrixValues);
        RectFData addition = new RectFData(newRectF, color);
        // Add the new rectangle
        cropRectFMap.put(id, addition);

        // Make it focused
        focusedCropId = id;

        // Draw canvas again after addition
        invalidate();
    }

    public void addCropPolygon(String id, int color, int sides, CropObjectStatus status) {
        if (startValues == null) {
            setStartValues();
        }
        // Check if Id is unique
        if (polygonMap.containsKey(id)) {
            throw new IllegalArgumentException("Crop polygon with provided ID: " + id + "already exists");
        }

        // Calculate edge length according to visible screen to user
        float rel_sx = matrixValues[Matrix.MSCALE_X] / startValues[Matrix.MSCALE_X];
        float rel_sy = matrixValues[Matrix.MSCALE_Y] / startValues[Matrix.MSCALE_Y];

        float width = getDrawable().getIntrinsicWidth() / (2 * rel_sx);
        float height = getDrawable().getIntrinsicHeight() / (2 * rel_sy);

        PointF center = getScreenCenterCoors();
        // Take the minimum of height and width to be the edge length
        float edgeL = min(height, width);

        // Determine points of the polygon
        PointF[] points = new PointF[sides];
        // Calculate the angle of rotation for each corner
        double rotateAngle = 2 * Math.PI / sides;

        // Coordinate for first corner
        float x = center.x;
        float y = center.y - edgeL / 2;
        for (int i = 0; i < sides; i++) {
            double rotateX = Math.sin(rotateAngle * i);
            double rotateY = Math.cos(rotateAngle * i);
            float cornerX = (float) (center.x + edgeL / 2 * rotateX);
            float cornerY = (float) (center.y + edgeL / 2 * rotateY);
            points[i] = new PointF(cornerX, cornerY);
        }

        Polygon polygon = new Polygon(points);
        PolygonData polygonData = new PolygonData(polygon, color, status);
        // Add the new polygon
        polygonMap.put(id, polygonData);

        // Make it focused
        focusedCropId = id;

        invalidate();
    }

    public PointF getScreenCenterCoors() {
        // Relative coordinates where the rectangle is to be drawn
        float x_relative = getWidth() / 2;
        float y_relative = getHeight() / 2;

        float x = (x_relative - matrixValues[Matrix.MTRANS_X]) / matrixValues[Matrix.MSCALE_X];
        float y = getDrawable().getIntrinsicHeight() / 2;
        if (getCurrentDisplayedHeight() > getHeight()) {
            y = (y_relative - matrixValues[Matrix.MTRANS_Y]) / matrixValues[Matrix.MSCALE_Y];
        }

        return new PointF(x, y);
    }

    /**
     * Add Crop Rectangle with provided relative dimensions
     *
     * @param id    Unique Id of the crop rectangle to be added
     * @param color Color of the crop rectangle to be added
     * @param rectF RectF object containing the relative coordinates for the rectangle to be drawn
     */
    public void addCropRectangle(String id, int color, RectF rectF) {
        // Check if Id is unique
        if (cropRectFMap.containsKey(id)) {
            throw new IllegalArgumentException("Crop rectangle with provided ID: " + id + "already exists");
        }
        // Convert the coordinates according to the canvas dimensions and state
        float convertedLeft = Common.reverseScaleAndTranslateX(rectF.left * (bounds.right - bounds.left) + bounds.left, matrixValues);
        float convertedTop = Common.reverseScaleAndTranslateY(rectF.top * (bounds.bottom - bounds.top) + bounds.top, matrixValues);
        float convertedRight = Common.reverseScaleAndTranslateX(rectF.right * (bounds.right - bounds.left) + bounds.left, matrixValues);
        float convertedBottom = Common.reverseScaleAndTranslateY(rectF.bottom * (bounds.bottom - bounds.top) + bounds.top, matrixValues);

        RectF newRectF = new RectF(convertedLeft, convertedTop, convertedRight, convertedBottom);

        RectFData addition = new RectFData(newRectF, color);
        // Add the new crop rectangle
        cropRectFMap.put(id, addition);
        // Draw again on the screen
        invalidate();
    }

    /**
     * Add Crop Polygon with provided relative dimensions
     *
     * @param id      Unique Id of the crop rectangle to be added
     * @param color   Color of the crop rectangle to be added
     * @param polygon Polygon object containing the relative coordinates for the rectangle to be drawn
     */
    public void addCropPolygon(String id, int color, Polygon polygon, CropObjectStatus status) {
        // Check if Id is unique
        if (polygonMap.containsKey(id)) {
            throw new IllegalArgumentException("Crop polygon with provided ID: " + id + "already exists");
        }
        // Convert the coordinates according to the canvas dimensions and state
        for (PointF point : polygon.points) {
            point.x = Common.reverseScaleAndTranslateX(point.x * (bounds.right - bounds.left) + bounds.left, matrixValues);
            point.y = Common.reverseScaleAndTranslateY(point.y * (bounds.bottom - bounds.top) + bounds.top, matrixValues);
        }

        PolygonData addition = new PolygonData(polygon, color, status);
        // Add the new crop Polygon
        polygonMap.put(id, addition);
        // Draw again on the screen
        invalidate();
    }

    /**
     * Removes a crop object with specified ID.
     *
     * @param id Id of the crop object to be removed
     */
    public void removeCropObject(String id) {
        if (cropRectFMap.containsKey(id)) {
            cropRectFMap.remove(id);
        } else if (polygonMap.containsKey(id)) {
            polygonMap.remove(id);
        }
        invalidate();
    }

    /**
     * Lock or unlock the rectangle in canvas from move and resize
     *
     * @param id
     * @return
     */
    public Boolean lockOrUnlockCropObject(String id) {
        CropObjectData cropObjectData;
        // Check if a crop object exists with the given ID
        if (cropRectFMap.containsKey(id)) {
            cropObjectData = cropRectFMap.get(id);
        } else if (polygonMap.containsKey(id)) {
            cropObjectData = polygonMap.get(id);
        } else {
            throw new IllegalArgumentException("There is no crop object with the id: " + id);
        }
        if (cropObjectData.locked) {
            cropObjectData.locked = false;
            return false;
        } else {
            cropObjectData.locked = true;
            return true;
        }
    }

    public void setCropObjectColor(String id, int color) {
        CropObjectData cropObjectData;
        // Check if a crop object exists with the given ID
        if (cropRectFMap.containsKey(id)) {
            cropObjectData = cropRectFMap.get(id);
        } else if (polygonMap.containsKey(id)) {
            cropObjectData = polygonMap.get(id);
        } else {
            throw new IllegalArgumentException("There is no crop object with the id: " + id);
        }
        cropObjectData.color = color;
        invalidate();
    }

    /**
     * Return the id of the rectangle currently in focus. Returns null if no rectangle in focus
     *
     * @return Id of the focused rectangle
     */
    public String getFocusedCropObjectId() {
        return focusedCropId;
    }

    /**
     * Set click listener for the event of a click inside a crop rectangle.
     *
     * @param listener
     */
    public void setOnCropRectangleClickListener(OnCropRectangleClickListener listener) {
        cropRectangleClickListener = listener;
    }

    /**
     * Set click listener for the event of a click inside a crop polygon.
     *
     * @param listener
     */
    public void setOnCropPolygonClickListener(OnCropPolygonClickListener listener) {
        cropPolygonClickListener = listener;
    }

    /**
     * Get ids of the crop rectangle present in the canvas
     *
     * @return ArrayList of ids
     */
    public ArrayList<String> getAllCropRectangleIds() {
        return new ArrayList<>(cropRectFMap.keySet());
    }

    /**
     * Get ids of the crop polygon present in the canvas
     *
     * @return ArrayList of ids
     */
    public ArrayList<String> getAllCropPolygonIds() {
        return new ArrayList<>(polygonMap.keySet());
    }

    /**
     * Get relative coordinates for the rectangle boxes drawn on the canvas
     *
     * @return Hashmap with key as id and value as rectF containing the relative coordinates
     */
    public LinkedHashMap<String, RectF> getCoordinatesForRectCropBoxes() {

        LinkedHashMap<String, RectF> coordinates = new LinkedHashMap<>();

        for (String id : cropRectFMap.keySet()) {
            RectFData rectFData = cropRectFMap.get(id);
            RectF rectF = rectFData.rectF;
            RectF relativeRectF = new RectF(
                    (Common.scaleAndTranslateX(rectF.left, matrixValues) - bounds.left) / (bounds.right - bounds.left),
                    (Common.scaleAndTranslateY(rectF.top, matrixValues) - bounds.top) / (bounds.bottom - bounds.top),
                    (Common.scaleAndTranslateX(rectF.right, matrixValues) - bounds.left) / (bounds.right - bounds.left),
                    (Common.scaleAndTranslateY(rectF.bottom, matrixValues) - bounds.top) / (bounds.bottom - bounds.top)
            );
            coordinates.put(id, relativeRectF);
        }

        return coordinates;
    }

    /**
     * Get relative coordinates for the polygon boxes drawn on the canvas
     *
     * @return Hashmap with key as id and value as rectF containing the relative coordinates
     */
    public LinkedHashMap<String, Polygon> getCoordinatesForPolygonCropBoxes() {

        LinkedHashMap<String, Polygon> coordinates = new LinkedHashMap<>();

        for (String id : polygonMap.keySet()) {
            PolygonData polygonData = polygonMap.get(id);
            Polygon polygon = polygonData.polygon;
            PointF[] relativePoints = new PointF[polygon.points.length];
            for (int i = 0; i < polygon.points.length; i++) {
                PointF point = polygon.points[i];
                float x = (Common.scaleAndTranslateX(point.x, matrixValues) - bounds.left) / (bounds.right - bounds.left);
                float y = (Common.scaleAndTranslateY(point.y, matrixValues) - bounds.top) / (bounds.bottom - bounds.top);
                relativePoints[i] = new PointF(x, y);
            }
            coordinates.put(id, new Polygon(relativePoints));
        }

        return coordinates;
    }

    /**
     * Remember our starting values so we can animate our image back to its original position.
     */
    private void setStartValues() {
        startValues = new float[9];
        startMatrix = new Matrix(getImageMatrix());
        startMatrix.getValues(startValues);
        calculatedMinScale = minScale * startValues[Matrix.MSCALE_X];
        calculatedMaxScale = maxScale * startValues[Matrix.MSCALE_X];
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);

        if (startValues == null) {
            setStartValues();
        }

//        currentPointerCount = event.getPointerCount();

        //get the current state of the image matrix, its values, and the bounds of the drawn bitmap
        matrix.set(getImageMatrix());
        matrix.getValues(matrixValues);
        updateBounds(matrixValues);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {

        resetImage = false;

        if (!isClickable() && isEnabled() && (zoomable || translatable)) {
            if (getScaleType() != ScaleType.MATRIX) {
                super.setScaleType(ScaleType.MATRIX);
            }

            if (startValues == null) {
                setStartValues();
            }

            currentPointerCount = event.getPointerCount();

            //get the current state of the image matrix, its values, and the bounds of the drawn bitmap
            matrix.set(getImageMatrix());
            matrix.getValues(matrixValues);
            updateBounds(matrixValues);

            scaleDetector.onTouchEvent(event);
            gestureDetector.onTouchEvent(event);

            if (doubleTapToZoom && doubleTapDetected) {
                doubleTapDetected = false;
                singleTapDetected = false;
                if (matrixValues[Matrix.MSCALE_X] != startValues[Matrix.MSCALE_X]) {
                    reset();
                } else {
                    Matrix zoomMatrix = new Matrix(matrix);
                    zoomMatrix.postScale(doubleTapToZoomScaleFactor, doubleTapToZoomScaleFactor, scaleDetector.getFocusX(), scaleDetector.getFocusY());
                    animateScaleAndTranslationToMatrix(zoomMatrix, RESET_DURATION);
                }
                return true;
            } else if (!singleTapDetected) {
                /* if the event is a down touch, or if the number of touch points changed,
                 * we should reset our start point, as event origins have likely shifted to a
                 * different part of the screen*/
                if (event.getActionMasked() == MotionEvent.ACTION_DOWN ||
                        currentPointerCount != previousPointerCount) {
                    last.set(scaleDetector.getFocusX(), scaleDetector.getFocusY());
                    currentRectangleTouchArea = TouchArea.NONE;
                    currentPolygonTouchArea = NONE;
                } else if (event.getActionMasked() == MotionEvent.ACTION_MOVE) {

                    final float focusx = scaleDetector.getFocusX();
                    final float focusy = scaleDetector.getFocusY();

                    // TODO: MOVE THIS INITIALISATION ON THE TOP
                    TouchUtils rectangleTouchUtil = new TouchUtils(cropRectFMap, matrixValues);
                    com.jsibbold.zoomage.utils.Polygon.TouchUtils polygonTouchUtil = new com.jsibbold.zoomage.utils.Polygon.TouchUtils(polygonMap, matrixValues);

                    // For rectangle crop element
                    if (cropRectFMap.size() > 0 &&
                            currentRectangleTouchArea == TouchArea.NONE) {
                        Pair<String, TouchArea> touchAreaResult = rectangleTouchUtil.checkTouchArea(focusx, focusy);
                        focusedCropId = touchAreaResult.first;
                        currentRectangleTouchArea = touchAreaResult.second;

                    }

                    // For polygon crop element
                    if (polygonMap.size() > 0 &&
                            currentPolygonTouchArea == NONE) {
                        Pair<String, Integer> touchAreaResult = polygonTouchUtil.checkTouchArea(focusx, focusy, focusedCropId);
                        focusedCropId = touchAreaResult.first;
                        currentPolygonTouchArea = touchAreaResult.second;
                    }
                    // Check if canvas has rectangle crop objects
                    if (cropRectFMap.size() > 0) {
                        if (currentRectangleTouchArea == TouchArea.OUT_OF_BOUNDS || currentPointerCount > 1) {
                            // Move the matrix
                            scaleAndTranslateMatrix(event);
                        } else {
                            // Translate only if the crop rect is not locked
                            if (!cropRectFMap.get(focusedCropId).locked) {
                                // TODO: MOVE THIS INITIALISATION ON THE TOP
                                TranslateUtils translateUtils = new TranslateUtils(cropRectFMap.get(focusedCropId).rectF, bounds, matrixValues);
                                RectF translatedRect = translateUtils.translateRectF(currentRectangleTouchArea, (focusx - last.x) / matrixValues[Matrix.MSCALE_X], (focusy - last.y) / matrixValues[Matrix.MSCALE_Y]);
                                cropRectFMap.get(focusedCropId).rectF = translatedRect;
                            }
                        }
                    } else if (polygonMap.size() > 0) {
                        // Canvas has polygon crop objects
                        if (currentPolygonTouchArea == OUT_OF_BOUNDS || currentPointerCount > 1) {
                            // Move the matrix
                            scaleAndTranslateMatrix(event);
                        } else {
                            // Translate only if the crop polygon is not locked
                            if (!polygonMap.get(focusedCropId).locked) {
                                // TODO: MOVE THIS INITIALISATION ON THE TOP
                                com.jsibbold.zoomage.utils.Polygon.TranslateUtils translateUtils
                                        = new com.jsibbold.zoomage.utils.Polygon.TranslateUtils(
                                        polygonMap.get(focusedCropId).polygon, bounds, matrixValues
                                );
                                Polygon translatedPolygon = translateUtils.translateRectF(
                                        currentPolygonTouchArea,
                                        (focusx - last.x) / matrixValues[Matrix.MSCALE_X],
                                        (focusy - last.y) / matrixValues[Matrix.MSCALE_Y]
                                );
                                polygonMap.get(focusedCropId).polygon = translatedPolygon;
                            }
                        }
                    } else {
                        scaleAndTranslateMatrix(event);
                    }

                    setImageMatrix(matrix);
                    invalidate();

                    last.set(focusx, focusy);
                }

                if (event.getActionMasked() == MotionEvent.ACTION_UP ||
                        event.getActionMasked() == MotionEvent.ACTION_CANCEL) {
                    scaleBy = 1f;
                    resetImage();
                }
                invalidate();
            } else {
                // Single Tap Detected
                final float focusx = scaleDetector.getFocusX();
                final float focusy = scaleDetector.getFocusY();
                // See if the tap was inside a crop rectangle
                TouchUtils rectangleTouchUtil = new TouchUtils(cropRectFMap, matrixValues);
                com.jsibbold.zoomage.utils.Polygon.TouchUtils
                        polygonTouchUtil = new com.jsibbold.zoomage.utils.Polygon.TouchUtils(
                        polygonMap,
                        matrixValues
                );
                // Check touch area for rectangle crop object
                Pair<String, TouchArea> rectangleTouchAreaResult = rectangleTouchUtil.checkTouchArea(focusx, focusy);
                String rectangleFocusId = rectangleTouchAreaResult.first;

                // If Touch area is on a crop rectangle, call the Listener
                if (rectangleFocusId != null
                        && cropRectangleClickListener != null
                        && cropRectFMap.containsKey(focusedCropId)) {
                    cropRectangleClickListener.onClick(cropRectFMap.get(focusedCropId));
                }

                // Check touch area for polygon crop object
                Pair<String, Integer> polygonTouchAreaResult = polygonTouchUtil.checkTouchArea(focusx, focusy, focusedCropId);
                String polygonFocusId = polygonTouchAreaResult.first;

                // If Touch area is on a crop polygon, call the Listener
                if (polygonFocusId != null
                        && cropPolygonClickListener != null
                        && polygonMap.containsKey(focusedCropId)) {
                    cropPolygonClickListener.onClick(polygonMap.get(focusedCropId));
                }

                focusedCropId = rectangleFocusId;
                if (polygonFocusId != null) focusedCropId = polygonFocusId;

                invalidate();
            }

            getParent().requestDisallowInterceptTouchEvent(disallowParentTouch(event));

            //this tracks whether they have changed the number of fingers down
            previousPointerCount = currentPointerCount;


            return true;
        }

        return super.onTouchEvent(event);
    }

    /*
        Anurag's custom method
        Translates the zoomed in matrix for a move gesture
        Note: The event parameter is not being used
     */
    private void scaleAndTranslateMatrix(MotionEvent event) {
        final float focusx = scaleDetector.getFocusX();
        final float focusy = scaleDetector.getFocusY();

        if (allowTranslate(event)) {
            //calculate the distance for translation
            float xdistance = getXDistance(focusx, last.x);
            float ydistance = getYDistance(focusy, last.y);
            matrix.postTranslate(xdistance, ydistance);
        }

        if (allowZoom(event)) {
            matrix.postScale(scaleBy, scaleBy, focusx, focusy);
            currentScaleFactor = matrixValues[Matrix.MSCALE_X] / startValues[Matrix.MSCALE_X];
        }
    }


    protected boolean disallowParentTouch(MotionEvent event) {
        if ((currentPointerCount > 1 || currentScaleFactor > 1.0f || isAnimating())) {
            return true;
        } else {
            return false;
        }
    }

    protected boolean allowTranslate(MotionEvent event) {
        return translatable && currentScaleFactor > 1.0f;
    }

    protected boolean allowZoom(MotionEvent event) {
        return zoomable;
    }

    private boolean isAnimating() {
        return resetAnimator != null && resetAnimator.isRunning();
    }

    /**
     * Reset the image based on the specified {@link AutoResetMode} mode.
     */
    private void resetImage() {
        switch (autoResetMode) {
            case AutoResetMode.UNDER:
                if (matrixValues[Matrix.MSCALE_X] <= startValues[Matrix.MSCALE_X]) {
                    reset();
                } else {
                    center();
                }
                break;
            case AutoResetMode.OVER:
                if (matrixValues[Matrix.MSCALE_X] >= startValues[Matrix.MSCALE_X]) {
                    reset();
                } else {
                    center();
                }
                break;
            case AutoResetMode.ALWAYS:
                reset();
                break;
            case AutoResetMode.NEVER:
                center();
        }
        invalidate();
    }

    /**
     * This helps to keep the image on-screen by animating the translation to the nearest
     * edge, both vertically and horizontally.
     */
    private void center() {
        if (autoCenter) {
            animateTranslationX();
            animateTranslationY();
        }
    }

    /**
     * Reset image back to its original size. Will snap back to original size
     * if animation on reset is disabled via {@link #setAnimateOnReset(boolean)}.
     */
    public void reset() {
        resetImage = true;
        reset(animateOnReset);
    }

    /**
     * Reset image back to its starting size. If {@code animate} is false, image
     * will snap back to its original size.
     *
     * @param animate animate the image back to its starting size
     */
    public void reset(final boolean animate) {
        if (animate) {
            animateToStartMatrix();
        } else {
            setImageMatrix(startMatrix);
            invalidate();
        }
    }

    /**
     * Animate the matrix back to its original position after the user stopped interacting with it.
     */
    private void animateToStartMatrix() {
        animateScaleAndTranslationToMatrix(startMatrix, RESET_DURATION);
    }

    /**
     * Animate the scale and translation of the current matrix to the target
     * matrix.
     *
     * @param targetMatrix the target matrix to animate values to
     */
    public void animateScaleAndTranslationToMatrix(final Matrix targetMatrix, final int duration) {

        if (getScaleType() != ScaleType.MATRIX) {
            super.setScaleType(ScaleType.MATRIX);
        }

        final float[] targetValues = new float[9];
        targetMatrix.getValues(targetValues);

        final Matrix beginMatrix = new Matrix(getImageMatrix());
        beginMatrix.getValues(matrixValues);

        //difference in current and original values
        final float xsdiff = targetValues[Matrix.MSCALE_X] - matrixValues[Matrix.MSCALE_X];
        final float ysdiff = targetValues[Matrix.MSCALE_Y] - matrixValues[Matrix.MSCALE_Y];
        final float xtdiff = targetValues[Matrix.MTRANS_X] - matrixValues[Matrix.MTRANS_X];
        final float ytdiff = targetValues[Matrix.MTRANS_Y] - matrixValues[Matrix.MTRANS_Y];

        setImageMatrix(targetMatrix);
        invalidate();

//        resetAnimator = ValueAnimator.ofFloat(0, 1f);
//        resetAnimator.addUpdateListener(new AnimatorUpdateListener() {
//
//            final Matrix activeMatrix = new Matrix(getImageMatrix());
//            final float[] values = new float[9];
//
//            @Override
//            public void onAnimationUpdate(ValueAnimator animation) {
//                float val = (Float) animation.getAnimatedValue();
//                activeMatrix.set(beginMatrix);
//                activeMatrix.getValues(values);
//                values[Matrix.MTRANS_X] = values[Matrix.MTRANS_X] + xtdiff * val;
//                values[Matrix.MTRANS_Y] = values[Matrix.MTRANS_Y] + ytdiff * val;
//                values[Matrix.MSCALE_X] = values[Matrix.MSCALE_X] + xsdiff * val;
//                values[Matrix.MSCALE_Y] = values[Matrix.MSCALE_Y] + ysdiff * val;
//                activeMatrix.setValues(values);
//                setImageMatrix(activeMatrix);
//                invalidate();
//            }
//        });
//
//        resetAnimator.addListener(new SimpleAnimatorListener() {
//            @Override
//            public void onAnimationEnd(Animator animation) {
//                setImageMatrix(targetMatrix);
//                invalidate();
//            }
//        });
//
//        resetAnimator.setDuration(duration);
//        resetAnimator.start();
    }

    private void animateTranslationX() {
        if (getCurrentDisplayedWidth() > getWidth()) {
            //the left edge is too far to the interior
            if (bounds.left > 0) {
                animateMatrixIndex(Matrix.MTRANS_X, 0);
            }
            //the right edge is too far to the interior
            else if (bounds.right < getWidth()) {
                animateMatrixIndex(Matrix.MTRANS_X, bounds.left + getWidth() - bounds.right);
            }
        } else {
            //left edge needs to be pulled in, and should be considered before the right edge
            if (bounds.left < 0) {
                animateMatrixIndex(Matrix.MTRANS_X, 0);
            }
            //right edge needs to be pulled in
            else if (bounds.right > getWidth()) {
                animateMatrixIndex(Matrix.MTRANS_X, bounds.left + getWidth() - bounds.right);
            }
        }
    }

    private void animateTranslationY() {
        if (getCurrentDisplayedHeight() > getHeight()) {
            //the top edge is too far to the interior
            if (bounds.top > 0) {
                animateMatrixIndex(Matrix.MTRANS_Y, 0);
            }
            //the bottom edge is too far to the interior
            else if (bounds.bottom < getHeight()) {
                animateMatrixIndex(Matrix.MTRANS_Y, bounds.top + getHeight() - bounds.bottom);
            }
        } else {
            //top needs to be pulled in, and needs to be considered before the bottom edge
            if (bounds.top < 0) {
                animateMatrixIndex(Matrix.MTRANS_Y, 0);
            }
            //bottom edge needs to be pulled in
            else if (bounds.bottom > getHeight()) {
                animateMatrixIndex(Matrix.MTRANS_Y, bounds.top + getHeight() - bounds.bottom);
            }
        }
    }

    private void animateMatrixIndex(final int index, final float to) {
        ValueAnimator animator = ValueAnimator.ofFloat(matrixValues[index], to);

        matrix.set(getImageMatrix());
        matrix.getValues(matrixValues);
        matrixValues[index] = to;
        matrix.setValues(matrixValues);
        setImageMatrix(matrix);
        invalidate();

        // Remove animations
//        final float[] values = new float[9];
//        Matrix current = new Matrix();
//
//        animator.addUpdateListener(new AnimatorUpdateListener() {
//
//            @Override
//            public void onAnimationUpdate(ValueAnimator animation) {
//                current.set(getImageMatrix());
//                current.getValues(values);
//                values[index] = (Float) animation.getAnimatedValue();
//                current.setValues(values);
//                matrix = current;
//                setImageMatrix(matrix);
//                invalidate();
//            }
//        });
//        animator.setDuration(RESET_DURATION);
//        animator.start();
    }

    /**
     * Get the x distance to translate the current image.
     *
     * @param toX   the current x location of touch focus
     * @param fromX the last x location of touch focus
     * @return the distance to move the image,
     * will restrict the translation to keep the image on screen.
     */
    private float getXDistance(final float toX, final float fromX) {
        float xdistance = toX - fromX;

        if (restrictBounds) {
            xdistance = getRestrictedXDistance(xdistance);
        }

        //prevents image from translating an infinite distance offscreen
        if (bounds.right + xdistance < 0) {
            xdistance = -bounds.right;
        } else if (bounds.left + xdistance > getWidth()) {
            xdistance = getWidth() - bounds.left;
        }

        return xdistance;
    }

    /**
     * Get the horizontal distance to translate the current image, but restrict
     * it to the outer bounds of the {@link ImageView}. If the current
     * image is smaller than the bounds, keep it within the current bounds.
     * If it is larger, prevent its edges from translating farther inward
     * from the outer edge.
     *
     * @param xdistance the current desired horizontal distance to translate
     * @return the actual horizontal distance to translate with bounds restrictions
     */
    private float getRestrictedXDistance(final float xdistance) {
        float restrictedXDistance = xdistance;

        if (getCurrentDisplayedWidth() >= getWidth()) {
            if (bounds.left <= 0 && bounds.left + xdistance > 0 && !scaleDetector.isInProgress()) {
                restrictedXDistance = -bounds.left;
            } else if (bounds.right >= getWidth() && bounds.right + xdistance < getWidth() && !scaleDetector.isInProgress()) {
                restrictedXDistance = getWidth() - bounds.right;
            }
        } else if (!scaleDetector.isInProgress()) {
            if (bounds.left >= 0 && bounds.left + xdistance < 0) {
                restrictedXDistance = -bounds.left;
            } else if (bounds.right <= getWidth() && bounds.right + xdistance > getWidth()) {
                restrictedXDistance = getWidth() - bounds.right;
            }
        }

        return restrictedXDistance;
    }

    /**
     * Get the y distance to translate the current image.
     *
     * @param toY   the current y location of touch focus
     * @param fromY the last y location of touch focus
     * @return the distance to move the image,
     * will restrict the translation to keep the image on screen.
     */
    private float getYDistance(final float toY, final float fromY) {
        float ydistance = toY - fromY;

        if (restrictBounds) {
            ydistance = getRestrictedYDistance(ydistance);
        }

        //prevents image from translating an infinite distance offscreen
        if (bounds.bottom + ydistance < 0) {
            ydistance = -bounds.bottom;
        } else if (bounds.top + ydistance > getHeight()) {
            ydistance = getHeight() - bounds.top;
        }

        return ydistance;
    }

    /**
     * Get the vertical distance to translate the current image, but restrict
     * it to the outer bounds of the {@link ImageView}. If the current
     * image is smaller than the bounds, keep it within the current bounds.
     * If it is larger, prevent its edges from translating farther inward
     * from the outer edge.
     *
     * @param ydistance the current desired vertical distance to translate
     * @return the actual vertical distance to translate with bounds restrictions
     */
    private float getRestrictedYDistance(final float ydistance) {
        float restrictedYDistance = ydistance;

        if (getCurrentDisplayedHeight() >= getHeight()) {
            if (bounds.top <= 0 && bounds.top + ydistance > 0 && !scaleDetector.isInProgress()) {
                restrictedYDistance = -bounds.top;
            } else if (bounds.bottom >= getHeight() && bounds.bottom + ydistance < getHeight() && !scaleDetector.isInProgress()) {
                restrictedYDistance = getHeight() - bounds.bottom;
            }
        } else if (!scaleDetector.isInProgress()) {
            if (bounds.top >= 0 && bounds.top + ydistance < 0) {
                restrictedYDistance = -bounds.top;
            } else if (bounds.bottom <= getHeight() && bounds.bottom + ydistance > getHeight()) {
                restrictedYDistance = getHeight() - bounds.bottom;
            }
        }

        return restrictedYDistance;
    }

    @Override
    public boolean onScale(ScaleGestureDetector detector) {

        //calculate value we should scale by, ultimately the scale will be startScale*scaleFactor
        scaleBy = (startScale * detector.getScaleFactor()) / matrixValues[Matrix.MSCALE_X];

        //what the scaling should end up at after the transformation
        final float projectedScale = scaleBy * matrixValues[Matrix.MSCALE_X];

        //clamp to the min/max if it's going over
        if (projectedScale < calculatedMinScale) {
            scaleBy = calculatedMinScale / matrixValues[Matrix.MSCALE_X];
        } else if (projectedScale > calculatedMaxScale) {
            scaleBy = calculatedMaxScale / matrixValues[Matrix.MSCALE_X];
        }

        return false;
    }

    @Override
    public boolean onScaleBegin(ScaleGestureDetector detector) {
        startScale = matrixValues[Matrix.MSCALE_X];
        return true;
    }

    @Override
    public void onScaleEnd(ScaleGestureDetector detector) {
        scaleBy = 1f;
    }

    private final GestureDetector.OnGestureListener gestureListener = new GestureDetector.SimpleOnGestureListener() {
        @Override
        public boolean onDoubleTapEvent(MotionEvent e) {
            if (e.getAction() == MotionEvent.ACTION_UP) {
                doubleTapDetected = true;
            }

            singleTapDetected = false;

            return false;
        }

        @Override
        public boolean onSingleTapUp(MotionEvent e) {
            singleTapDetected = true;
            return false;
        }

        @Override
        public boolean onSingleTapConfirmed(MotionEvent e) {
            singleTapDetected = false;
            return false;
        }

        @Override
        public boolean onDown(MotionEvent e) {
            return true;
        }
    };

    private class SimpleAnimatorListener implements Animator.AnimatorListener {
        @Override
        public void onAnimationStart(Animator animation) {
        }

        @Override
        public void onAnimationEnd(Animator animation) {
        }

        @Override
        public void onAnimationCancel(Animator animation) {
        }

        @Override
        public void onAnimationRepeat(Animator animation) {
        }
    }
}
