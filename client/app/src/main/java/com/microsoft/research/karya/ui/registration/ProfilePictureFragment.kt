package com.microsoft.research.karya.ui.registration

import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentProfilePictureBinding
import com.microsoft.research.karya.utils.ImageUtils
import com.microsoft.research.karya.utils.viewBinding

private const val REQUEST_IMAGE_CAPTURE = 101

class ProfilePictureFragment : Fragment(R.layout.fragment_profile_picture) {

  private val binding by viewBinding(FragmentProfilePictureBinding::bind)
  private val viewModel by activityViewModels<RegistrationViewModel>()

  private lateinit var profilePic: Bitmap

  private lateinit var registrationActivity: RegistrationActivity

  private fun setUpObservers() {
    viewModel.openSelectGenderFragmentFromProfilePicture.observe(viewLifecycleOwner) { navigate ->
      if (navigate) {
        navigateToSelectGenderFragment()
      }
    }

    viewModel.loadImageBitmap.observe(viewLifecycleOwner) { shouldLoad ->
      if (shouldLoad) {
        loadBitmap()
      }
    }
  }

  private fun loadBitmap() {
    ImageUtils.loadImageBitmap(requireActivity(), profilePic, binding.mainProfilePictureIv)
    viewModel.afterLoadingBitmap()
  }

  private fun navigateToSelectGenderFragment() {
    findNavController().navigate(R.id.action_profilePictureFragment_to_selectGenderFragment)
    viewModel.afterNavigateToSelectGender()
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    registrationActivity = activity as RegistrationActivity
    // baseActivity = activity as BaseActivity

    setUpObservers()

    /** Initialise assistant audio */
    // registrationActivity.current_assistant_audio = R.string.audio_profile_picture_prompt

    with(binding) {
      mainProfilePictureIv.setOnClickListener { getProfilePicture() }

      profilePictureNextIv.setOnClickListener {
        mainProfilePictureIv.isClickable = false
        rotateRightIb.isClickable = false
        profilePictureNextIv.visibility = View.INVISIBLE
        val imageFolder = requireActivity().getDir("profile_picture", AppCompatActivity.MODE_PRIVATE).path

        if (::profilePic.isInitialized) {
          viewModel.submitProfilePicture(profilePic, imageFolder)
        } else {
          navigateToSelectGenderFragment()
        }
      }

      rotateRightIb.setOnClickListener {
        if (::profilePic.isInitialized) {
          profilePic = viewModel.rotateRight(profilePic)
        }
      }

      appTb.setTitle(getString(R.string.s_profile_pic_title))
    }

    disableRotateButton()
  }

  /** Handle camera completion */
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

  /** Initiate the camera to capture profile picture */
  private fun getProfilePicture() {
    Intent(MediaStore.ACTION_IMAGE_CAPTURE).also { takePictureIntent ->
      takePictureIntent.resolveActivity(requireActivity().packageManager)?.also {
        startActivityForResult(takePictureIntent, REQUEST_IMAGE_CAPTURE)
      }
    }
  }

  /** Disable rotate button */
  private fun disableRotateButton() {
    binding.rotateRightIb.visibility = View.INVISIBLE
  }

  /** Enable rotate button */
  private fun enableRotateButton() {
    binding.rotateRightIb.visibility = View.VISIBLE
    binding.rotateRightIb.isClickable = true
  }
}
