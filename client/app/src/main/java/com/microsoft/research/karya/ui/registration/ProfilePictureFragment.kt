package com.microsoft.research.karya.ui.registration

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Bundle
import android.provider.MediaStore
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentProfilePictureBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.ImageUtils
import com.microsoft.research.karya.utils.viewBinding
import java.io.FileOutputStream

private const val REQUEST_IMAGE_CAPTURE = 101

class ProfilePictureFragment : Fragment(R.layout.fragment_profile_picture) {

    private val binding by viewBinding(FragmentProfilePictureBinding::bind)

    private lateinit var profilePic: Bitmap

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_profile_picture_prompt

        binding.mainProfilePictureIv.setOnClickListener { getProfilePicture() }

        binding.profilePictureNextIv.setOnClickListener {
            binding.mainProfilePictureIv.isClickable = false
            binding.rotateRightIb.isClickable = false
            binding.profilePictureNextIv.visibility = View.INVISIBLE
            submitProfilePicture()
        }

        binding.rotateRightIb.setOnClickListener { rotateRight() }

        disableRotateButton()

    }

    /**
     * On resume, play assistant audio if a profile pic is not already taken
     */
    override fun onResume() {
        super.onResume()
        if (!::profilePic.isInitialized) {
            baseActivity.onAssistantClick()
        }
    }

    /**
     * Handle camera completion
     */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        // Profile picture returned by the camera
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == AppCompatActivity.RESULT_OK) {
            profilePic = data?.extras?.get("data") as Bitmap
            binding.mainProfilePictureIv.setBackgroundResource(0)
            ImageUtils.loadImageBitmap(requireActivity(), profilePic, binding.mainProfilePictureIv)
            enableRotateButton()
        }
    }

    /**
     * Initiate the camera to capture profile picture
     */
    private fun getProfilePicture() {
        Intent(MediaStore.ACTION_IMAGE_CAPTURE).also { takePictureIntent ->
            takePictureIntent.resolveActivity(requireActivity().packageManager)?.also {
                startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE)
            }
        }
    }

    /**
     * Handle submit profile picture click.
     */
    private fun submitProfilePicture() {
        if (::profilePic.isInitialized) {
            WorkerInformation.profile_picture = profilePic
            val imageFolder = requireActivity().getDir("profile_picture", AppCompatActivity.MODE_PRIVATE).path
            val fileName = "pp.png"
            val out = FileOutputStream("$imageFolder/$fileName")
            profilePic.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        findNavController().navigate(R.id.action_profilePictureFragment_to_selectGenderFragment)
    }


    /**
     * Disable rotate button
     */
    private fun disableRotateButton() {
        binding.rotateRightIb.visibility = View.INVISIBLE
    }

    /**
     * Enable rotate button
     */
    private fun enableRotateButton() {
        binding.rotateRightIb.visibility = View.VISIBLE
        binding.rotateRightIb.isClickable = true
    }

    /**
     * Rotate right
     */
    private fun rotateRight() {
        if (::profilePic.isInitialized) {
            val matrix = Matrix()
            matrix.postRotate(90.toFloat())
            profilePic = Bitmap.createBitmap(
                profilePic, 0, 0, profilePic.width, profilePic.height,
                matrix, true
            )
            ImageUtils.loadImageBitmap(requireActivity(), profilePic, binding.mainProfilePictureIv)
        }
    }

}
