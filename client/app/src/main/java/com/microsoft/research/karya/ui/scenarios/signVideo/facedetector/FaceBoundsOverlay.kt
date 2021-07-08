package com.microsoft.research.karya.ui.scenarios.signVideo.facedetector

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PointF
import android.graphics.RectF
import android.util.AttributeSet
import android.util.Log
import android.view.View
import androidx.core.content.ContextCompat


/**
 * A [View] that renders the results of a face detection operation. It receives a list of face
 * bounds (represented by a list of [RectF]) and draws them, along with their tracking ids.
 */
class FaceBoundsOverlay @JvmOverloads constructor(ctx: Context, attrs: AttributeSet? = null) :
  View(ctx, attrs) {

  private val facesBounds = mutableListOf<FaceBounds>()
  private val idPaint = Paint()
  private val boundsPaint = Paint()
  private val borderPaint = Paint()
  private val textBgPaint = Paint()

  var box = RectF()
  var countGood = 0
  private var isRecording = false
  private lateinit var onStartRecording: () -> Unit

  private val TOO_FAR_RATIO = 20 // This is the ratio of entire view to face box
  private val TOO_NEAR_RATIO = 10
  private val TOO_ONE_SIDED = 3

  private val COUNT_GAP = 10

  private val COLOR_MAP = mapOf(
    "TOO_NEAR" to -65536,
    "TOO_FAR" to -65536,
    "GOOD" to -16711936,
    "TOO_LEFT" to -256,
    "TOO_RIGHT" to -256,
    "COUNTDOWN_1" to -16711936,
    "COUNTDOWN_2" to -16711936,
    "COUNTDOWN_3" to -16711936,
    "RECORDING" to -16711936,
    "NO_FACE" to -65536,
    "DEFAULT" to ContextCompat.getColor(context, android.R.color.black)
  )

  private val PROMPT_MAP = mapOf(
    "TOO_FAR" to "CLOSER 👇",
    "TOO_NEAR" to "FARTHER 👆",
    "GOOD" to "GOOD 👍",
    "TOO_LEFT" to "RIGHT 👉",
    "TOO_RIGHT" to "LEFT 👈",
    "MULTIPLE_FACES" to "MULTIPLE 👩‍👧",
    "NO_FACE" to "NO FACE",
    "COUNTDOWN_1" to "READY IN 3",
    "COUNTDOWN_2" to "READY IN 2",
    "COUNTDOWN_3" to "READY IN 1",
    "RECORDING" to "RECORDING"
  )

  init {

    textBgPaint.color = ContextCompat.getColor(context, android.R.color.black)

    idPaint.color = ContextCompat.getColor(context, android.R.color.white)
    idPaint.textSize = 70f
    idPaint.textAlign = Paint.Align.CENTER

    boundsPaint.style = Paint.Style.STROKE
    boundsPaint.color = ContextCompat.getColor(context, android.R.color.holo_blue_dark)
    boundsPaint.strokeWidth = 12f

    borderPaint.strokeWidth = 32f
    borderPaint.style = Paint.Style.STROKE
  }

  internal fun updateFaces(bounds: List<FaceBounds>) {
    facesBounds.clear()
    facesBounds.addAll(bounds)
    invalidate()
  }

  fun setOnStartRecording(func: () -> Unit) {
    onStartRecording = func
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    var mode = ""

    mode = "NO_FACE"

    if (facesBounds.size > 0) {
      mode = "GOOD"
      box.left = facesBounds[0].box.left
      box.right = facesBounds[0].box.right
      box.top = facesBounds[0].box.top
      box.bottom = facesBounds[0].box.bottom
    }

    if (mode != "NO_FACE") {

      // Check if it is too far or near based on areas
      val canvasArea = width * height
      val area = box.width() * box.height()
      if (canvasArea > TOO_FAR_RATIO * area)
        mode = "TOO_FAR"
      else if (canvasArea < TOO_NEAR_RATIO * area)
        mode = "TOO_NEAR"

      // If it is in the good region, check for left and right
      Log.e("box left", box.left.toString())
      Log.e("box width", box.width().toString())
      if (mode === "GOOD") {
        if ((box.left + box.right) / 2 < width / TOO_ONE_SIDED)
          mode = "TOO_LEFT"
        else if (width - (box.left + box.right) / 2 < width / TOO_ONE_SIDED)
          mode = "TOO_RIGHT"
      }

      if (mode === "GOOD")
        countGood += 1
      else
        countGood = 0
      if (countGood >= COUNT_GAP)
        mode = "COUNTDOWN_" + (countGood / COUNT_GAP).toString()
      if (countGood >= 4 * COUNT_GAP) {
        mode = "RECORDING"
        if (!isRecording) {
          isRecording = true
          onStartRecording()
        }
      }
    }
    // RESET THE MODE IF IT IS RECORDING
    if (isRecording) mode = "RECORDING"

    PROMPT_MAP[mode]?.let { canvas.drawPrompt(it, canvas) }
    if (mode != "NO_FACE" && !isRecording) canvas.drawBounds(box, mode, canvas)


  }

  /** Draws (Writes) the face's id. */
  private fun Canvas.drawPrompt(msg: String, canvas: Canvas) {
    drawRect(0f, 0f, canvas.width.toFloat(), 150f, textBgPaint)
    drawText(msg, (canvas.width / 2).toFloat(), 100f, idPaint)
  }

  /** Draws bounds around a face as a rectangle. */
  private fun Canvas.drawBounds(box: RectF, mode: String, canvas: Canvas) {
    boundsPaint.color = COLOR_MAP[mode]!!
    drawRect(box, boundsPaint)
    borderPaint.color = COLOR_MAP[mode]!!
    drawRect(0f, 0f, canvas.width.toFloat(), canvas.height.toFloat(), borderPaint)
  }

  private fun RectF.center(): PointF {
    val centerX = left + (right - left) / 2
    val centerY = top + (bottom - top) / 2
    return PointF(centerX, centerY)
  }

  companion object {
    private const val ANCHOR_RADIUS = 10f
    private const val ID_OFFSET = 50f
  }
}