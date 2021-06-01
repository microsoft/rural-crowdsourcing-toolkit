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
    cameraView.mode = Mode.VIDEO
    setupCamera()

    cameraView.addCameraListener(object : CameraListener() {
      override fun onVideoTaken(video: VideoResult) {
        super.onVideoTaken(video)
        setResult(RESULT_OK, intent)
        finish()
      }
    })

    // Countdown Timer
//    object : CountDownTimer(3000, 1000) {
//      override fun onFinish() {
//        cameraView.takeVideo(File(video_file_path))
//        timerTextView.invisible()
//        recordButton.visible()
//      }
//
//      override fun onTick(millisUntilFinished: Long) {
//        timerTextView.text = (millisUntilFinished / 1000 + 1).toString()
//      }
//
//    }.start()


    recordButton.setOnClickListener { handleRecordClick() }
  }

  private fun setupCamera() {
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

  private fun handleRecordClick() {
    // TODO: Implement the case of start recording once we move to automatic start
    // We have to only stop recording for now since the recording would start automatically when activity is launched
    cameraView.stopVideo()
  }

  override fun onBackPressed() {
  }

}