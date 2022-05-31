package com.microsoft.research.karya.ui.scenarios.imageLabelling

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.navigation.fragment.findNavController
import com.google.android.exoplayer2.util.Log
import com.microsoft.research.karya.R
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.visible
import com.otaliastudios.cameraview.CameraListener
import com.otaliastudios.cameraview.CameraOptions
import com.otaliastudios.cameraview.PictureResult
import com.otaliastudios.cameraview.gesture.Gesture
import com.otaliastudios.cameraview.gesture.GestureAction
import kotlinx.android.synthetic.main.fragment_image_labelling_camera.*


class CameraFragment : Fragment(R.layout.fragment_image_labelling_camera) {
  val viewModel: ImageLabellingViewModel by hiltNavGraphViewModels(R.id.imageLabellingFlow)
  private lateinit var captureResult: PictureResult

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    cameraCv.setLifecycleOwner(viewLifecycleOwner)
    cameraCv.mapGesture(Gesture.TAP, GestureAction.AUTO_FOCUS)


    takePictureBtn.setOnClickListener {
      cameraCv.takePicture()
      changeLayout(true)
    }

    acceptImageIv.setOnClickListener {
      viewModel.setCaptureResult(captureResult)
      findNavController().popBackStack()
    }

    rejectImageIv.setOnClickListener {
      // Reset the layout and start camera again
      changeLayout(false)
      cameraCv.open()
    }

    // Camera event listeners
    cameraCv.addCameraListener(object : CameraListener() {
      // When camera is opened, make capture view visible
      override fun onCameraOpened(options: CameraOptions) {
        super.onCameraOpened(options)
      }

      // Enable start capture button, after camera is closed
      override fun onCameraClosed() {
        super.onCameraClosed()
      }
      // When picture is taken, move it to the correct file
      override fun onPictureTaken(result: PictureResult) {
        super.onPictureTaken(result)
        captureResult = result
        cameraCv.close()
      }
    })

    cameraCv.open()

  }

  private fun changeLayout(pictureTaken: Boolean) {
    if (pictureTaken) {
      // Hide camera button
      takePictureBtn.gone()
      imageDecisionCv.visible()
    } else {
      takePictureBtn.visible()
      imageDecisionCv.gone()
    }
  }

}
