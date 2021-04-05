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
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.ImageUtils
import kotlinx.android.synthetic.main.fragment_profile_picture.*
import kotlinx.android.synthetic.main.fragment_profile_picture.view.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import java.io.FileOutputStream

private const val REQUEST_IMAGE_CAPTURE = 101

class ProfilePictureFragment : Fragment() {

    private lateinit var profilePic: Bitmap

    private lateinit var registrationActivity: RegistrationActivity
    private lateinit var baseActivity: BaseActivity

    protected val ioScope = CoroutineScope(Dispatchers.IO)
    protected val uiScope = CoroutineScope(Dispatchers.Main)

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View? {

        registrationActivity = activity as RegistrationActivity
        baseActivity = activity as BaseActivity

        // Inflate the layout for this fragment
        var fragmentView =  inflater.inflate(R.layout.fragment_profile_picture, container, false)

        /**
         * Set all initial UI strings
         */
        fragmentView.profilePicturePromptTv.text = registrationActivity.profilePicturePromptMessage

        return fragmentView

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        /** Initialise assistant audio **/
        registrationActivity.current_assistant_audio = R.string.audio_profile_picture_prompt

        mainProfilePictureIv.setOnClickListener { getProfilePicture() }

        profilePictureNextIv.setOnClickListener {
            mainProfilePictureIv.isClickable = false
            rotateRightIb.isClickable = false
            profilePictureNextIv.visibility = View.INVISIBLE
            submitProfilePicture()
        }

        rotateRightIb.setOnClickListener { rotateRight() }

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
            mainProfilePictureIv.setBackgroundResource(0)
            ImageUtils.loadImageBitmap(requireActivity(), profilePic, mainProfilePictureIv)
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
        rotateRightIb.visibility = View.INVISIBLE
    }

    /**
     * Enable rotate button
     */
    private fun enableRotateButton() {
        rotateRightIb.visibility = View.VISIBLE
        rotateRightIb.isClickable = true
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
            ImageUtils.loadImageBitmap(requireActivity(), profilePic, mainProfilePictureIv)
        }
    }

}
