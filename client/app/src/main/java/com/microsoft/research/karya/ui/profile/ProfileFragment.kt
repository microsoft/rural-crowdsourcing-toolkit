package com.microsoft.research.karya.ui.profile

import android.graphics.BitmapFactory
import android.os.Bundle
import android.view.View
import androidx.activity.result.contract.ActivityResultContracts
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentProfilePictureBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ProfileFragment : Fragment(R.layout.fragment_profile_picture) {

  private val binding by viewBinding(FragmentProfilePictureBinding::bind)
  private val viewModel by viewModels<ProfileViewModel>()

  private val selectPicture =
    registerForActivityResult(ActivityResultContracts.TakePicturePreview()) { bitmap ->
      if (bitmap == null) return@registerForActivityResult

      viewModel.saveProfileImage(bitmap)
    }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupView()
    observeUi()
    observeEffects()

    // registrationActivity.current_assistant_audio = R.string.audio_profile_picture_prompt
    // disableRotateButton()
  }

  private fun setupView() {
    with(binding) {
      mainProfilePictureIv.setOnClickListener { selectPicture.launch(null) }

      profilePictureNextIv.setOnClickListener { viewModel.saveProfileData("") }

      rotateRightIb.setOnClickListener { viewModel.rotateProfileImage() }

      appTb.setTitle(getString(R.string.s_profile_pic_title))
    }
  }

  private fun observeUi() {
    viewModel.profileUiState.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { state ->
      when (state) {
        is ProfileUiState.Success -> showSuccessUi(state.data)
        is ProfileUiState.Error -> showErrorUi(state.throwable.message!!)
        ProfileUiState.Initial -> showInitialUi()
        ProfileUiState.Loading -> showLoadingUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.profileEffects.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { effect ->
      when (effect) {
        ProfileEffects.Navigate -> navigateToSelectGenderFragment()
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      profilePictureNextIv.visible()
      rotateRightIb.gone()
    }
  }

  private fun showLoadingUi() {
    with(binding) { rotateRightIb.gone() }
  }

  private fun showSuccessUi(bitmapPath: String?) {
    with(binding) {
      rotateRightIb.visible()
      enableRotateButton()

      if (!bitmapPath.isNullOrEmpty()) {
        val bitmap = BitmapFactory.decodeFile(bitmapPath)
        mainProfilePictureIv.setImageBitmap(bitmap)
      }
    }
  }

  private fun showErrorUi(message: String) {
    with(binding) {
      rotateRightIb.gone()
      disableRotateButton()
    }
  }

  private fun takePicture() {
    selectPicture.launch(null)
  }

  private fun navigateToSelectGenderFragment() {
    findNavController().navigate(R.id.action_profilePictureFragment_to_selectGenderFragment)
  }

  private fun disableRotateButton() {
    binding.rotateRightIb.visibility = View.INVISIBLE
  }

  private fun enableRotateButton() {
    binding.rotateRightIb.visibility = View.VISIBLE
    binding.rotateRightIb.isClickable = true
  }
}
