package com.microsoft.research.karya.ui.scenarios.signVideo

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.microsoft.research.karya.R
import com.otaliastudios.cameraview.CameraListener
import com.otaliastudios.cameraview.VideoResult
import com.otaliastudios.cameraview.controls.Facing
import com.otaliastudios.cameraview.controls.Mode
import kotlinx.android.synthetic.main.fragment_sign_video_record.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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

    cameraView.addCameraListener( object : CameraListener() {
      override fun onVideoTaken(video: VideoResult) {
        super.onVideoTaken(video)
        setResult(RESULT_OK, intent)
        finish()
      }
    })

    lifecycleScope.launch {
      delay(1000)
      cameraView.takeVideo(File(video_file_path))
    }

    recordButton.setOnClickListener { handleRecordClick() }
  }

  private fun handleRecordClick() {
    // TODO: Implement the case of start recording once we move to automatic start
    // We have to only stop recording for now since the recording would start automatically when activity is launched
    cameraView.stopVideo()
  }

}