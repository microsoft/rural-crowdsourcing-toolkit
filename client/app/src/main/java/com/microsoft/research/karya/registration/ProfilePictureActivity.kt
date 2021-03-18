// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Matrix
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import com.microsoft.research.karya.utils.ImageUtils
import kotlinx.android.synthetic.main.activity_profile_pic.*
import java.io.FileOutputStream

private const val REQUEST_IMAGE_CAPTURE = 101

class ProfilePictureActivity : BaseActivity(useAssistant = true, playAssistantOnResume = false) {

    /** Android strings */
    private var profilePicturePromptMessage: String = ""
    private lateinit var profilePic: Bitmap

    override fun onCreate(savedInstanceState: Bundle?) {
        setContentView(R.layout.activity_profile_pic)
        super.onCreate(savedInstanceState)

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
     * Get all strings for the activity
     */
    override suspend fun getStringsForActivity() {
        profilePicturePromptMessage = getValueFromName(R.string.profile_picture_prompt)
    }

    /**
     * Set all initial UI strings
     */
    override suspend fun setInitialUIStrings() {
        profilePicturePromptTv.text = profilePicturePromptMessage
    }

    /**
     * On resume, play assistant audio if a profile pic is not already taken
     */
    override fun onResume() {
        super.onResume()
        if (!::profilePic.isInitialized) {
            onAssistantClick()
        }
    }

    /**
     * On assistant click, play the profile picture prompt
     */
    override fun onAssistantClick() {
        super.onAssistantClick()
        playAssistantAudio(R.string.audio_profile_picture_prompt)
    }

    /**
     * Handle camera completion
     */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        // Profile picture returned by the camera
        if (requestCode == REQUEST_IMAGE_CAPTURE && resultCode == RESULT_OK) {
            profilePic = data?.extras?.get("data") as Bitmap
            mainProfilePictureIv.setBackgroundResource(0)
            ImageUtils.loadImageBitmap(this, profilePic, mainProfilePictureIv)
            enableRotateButton()
        }
    }

    /**
     * Initiate the camera to capture profile picture
     */
    private fun getProfilePicture() {
        Intent(MediaStore.ACTION_IMAGE_CAPTURE).also { takePictureIntent ->
            takePictureIntent.resolveActivity(packageManager)?.also {
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
            val imageFolder = getDir("profile_picture", MODE_PRIVATE).path
            val fileName = "pp.png"
            val out = FileOutputStream("$imageFolder/$fileName")
            profilePic.compress(Bitmap.CompressFormat.PNG, 100, out)
        }
        startActivity(Intent(applicationContext, SelectGenderActivity::class.java))
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
            ImageUtils.loadImageBitmap(this, profilePic, mainProfilePictureIv)
        }
    }
}
