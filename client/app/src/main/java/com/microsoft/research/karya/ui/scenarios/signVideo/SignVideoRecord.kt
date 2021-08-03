package com.microsoft.research.karya.ui.scenarios.signVideo

import android.os.Bundle
import android.os.CountDownTimer
import android.util.Size
import androidx.appcompat.app.AppCompatActivity
import com.abedelazizshe.lightcompressorlibrary.CompressionListener
import com.abedelazizshe.lightcompressorlibrary.VideoCompressor
import com.abedelazizshe.lightcompressorlibrary.VideoQuality
import com.abedelazizshe.lightcompressorlibrary.config.Configuration
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
import java.io.FileInputStream
import java.io.FileOutputStream

class SignVideoRecord : AppCompatActivity() {

  private lateinit var video_file_path: String
  private lateinit var scratch_video_file_path: String

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.fragment_sign_video_record)

    video_file_path = intent.getStringExtra("video_file_path")!!
    scratch_video_file_path = "${video_file_path}.scratch.mp4"

    compressionProgress.invisible()
    compressionProgress.progress = 0

    cameraView.setLifecycleOwner(this)
    cameraView.facing = Facing.FRONT
    cameraView.audio = Audio.OFF;
    cameraView.mode = Mode.VIDEO
    cameraView.addCameraListener(object : CameraListener() {
      override fun onVideoTaken(video: VideoResult) {
        super.onVideoTaken(video)
        VideoCompressor.start(
          srcPath = scratch_video_file_path,
          destPath = video_file_path,
          configureWith = Configuration(
            quality = VideoQuality.VERY_LOW,
            keepOriginalResolution = false
          ),
          listener = object : CompressionListener {
            override fun onStart() {
              runOnUiThread {
                stopRecordButton.invisible()
                compressionProgress.visible()
                compressionProgress.progress = 0
              }
            }

            override fun onProgress(percent: Float) {
              runOnUiThread {
                compressionProgress.progress = percent.toInt()
              }
            }

            override fun onSuccess() {
              File(scratch_video_file_path).delete()
              setResult(RESULT_OK, intent)
              finish()
            }

            override fun onFailure(failureMessage: String) {
              val inFile = FileInputStream(scratch_video_file_path)
              val outFile = FileOutputStream(video_file_path)
              inFile.copyTo(outFile)
              inFile.close()
              outFile.close()
              File(scratch_video_file_path).delete()
              setResult(RESULT_OK, intent)
              finish()
            }

            override fun onCancelled() {
              val inFile = FileInputStream(scratch_video_file_path)
              val outFile = FileOutputStream(video_file_path)
              inFile.copyTo(outFile)
              inFile.close()
              outFile.close()
              File(scratch_video_file_path).delete()
              setResult(RESULT_OK, intent)
              finish()
            }
          }
        )
      }
    })
    setupCamera()
    stopRecordButton.setOnClickListener { handleStopRecordClick() }
  }

  private fun onStartRecording() {
    cameraView.takeVideo(File(scratch_video_file_path))
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
