package com.microsoft.research.karya.ui.scenarios.signVideo

import android.os.Bundle
import android.os.CountDownTimer
import android.util.Size
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.signVideo.facedetector.FaceDetector
import com.microsoft.research.karya.ui.scenarios.signVideo.facedetector.Frame
import com.microsoft.research.karya.ui.scenarios.signVideo.facedetector.LensFacing
import com.microsoft.research.karya.utils.extensions.invisible
import com.microsoft.research.karya.utils.extensions.visible
import com.otaliastudios.cameraview.CameraListener
import com.otaliastudios.cameraview.VideoResult
import com.otaliastudios.cameraview.controls.Audio
import com.otaliastudios.cameraview.controls.Facing
import com.otaliastudios.cameraview.controls.Mode
import kotlinx.android.synthetic.main.fragment_sign_video_record.*
import java.io.File

class SignVideoRecord : AppCompatActivity() {

  private lateinit var video_file_path: String

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.fragment_sign_video_record)

    video_file_path = intent.getStringExtra("video_file_path")!!

    cameraView.setLifecycleOwner(this)
    cameraView.facing = Facing.FRONT
    cameraView.audio = Audio.OFF;
    cameraView.mode = Mode.VIDEO
    cameraView.addCameraListener(object : CameraListener() {
      override fun onVideoTaken(video: VideoResult) {
        super.onVideoTaken(video)
        setResult(RESULT_OK, intent)
        finish()
      }
    })
    setupCamera()
    stopRecordButton.setOnClickListener { handleStopRecordClick() }
  }

  private fun onStartRecording() {
    cameraView.takeVideo(File(video_file_path))
    stopRecordButton.visible()
  }

  private fun setupCamera() {

    faceBoundsOverlay.setOnStartRecording(::onStartRecording)

    val faceDetector = FaceDetector(faceBoundsOverlay)
    cameraView.addFrameProcessor {
      faceDetector.process(
        Frame(
          data = it.getData(),
          rotation = it.rotation,
          size = Size(it.size.width, it.size.height),
          format = it.format,
          lensFacing = LensFacing.FRONT
        )
      )
    }
  }

  private fun handleStopRecordClick() {
    cameraView.stopVideo()
  }

  override fun onBackPressed() {
  }

}