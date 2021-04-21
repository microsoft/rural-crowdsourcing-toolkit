package com.microsoft.research.karya.ui.registration

import android.os.Bundle
import android.util.TypedValue
import android.view.View
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.service.KaryaAPIService
import com.microsoft.research.karya.databinding.FragmentCreationCodeBinding
import com.microsoft.research.karya.ui.base.BaseActivity
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import com.microsoft.research.karya.utils.viewBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * A simple [Fragment] subclass. Use the [CreationCodeFragment.newInstance] factory method to create
 * an instance of this fragment.
 */
private const val CREATION_CODE_LENGTH = 16

class CreationCodeFragment : Fragment(R.layout.fragment_creation_code) {

  /** Compute creation code text box length based on the creation code length */
  private val creationCodeEtMax = CREATION_CODE_LENGTH + (CREATION_CODE_LENGTH - 1) / 4

  private lateinit var registrationActivity: RegistrationActivity
  private lateinit var baseActivity: BaseActivity
  private lateinit var karyaAPI: KaryaAPIService

  private val binding by viewBinding(FragmentCreationCodeBinding::bind)

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    registrationActivity = activity as RegistrationActivity
    baseActivity = activity as BaseActivity
    karyaAPI = baseActivity.karyaAPI

    /** Initialise assistant audio */
    registrationActivity.current_assistant_audio = R.string.audio_access_code_prompt

    /** Set the creation code font size to the same value as the phantom text view font size */
    binding.phantomCCTv.addOnLayoutChangeListener {
        _: View,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int,
        _: Int ->
      binding.creationCodeEt.setTextSize(TypedValue.COMPLEX_UNIT_PX, binding.phantomCCTv.textSize)
    }

    /** Add text change listener to creation code */
    binding.creationCodeEt.addTextChangedListener(
        object : SeparatorTextWatcher('-', 4) {
          override fun onAfterTextChanged(text: String, position: Int) {
            binding.creationCodeEt.run {
              setText(text)
              setSelection(position)
            }

            /** If creation code length has reached max, call handler */
            if (binding.creationCodeEt.length() == creationCodeEtMax) {
              handleFullCreationCode()
            } else {
              clearErrorMessages()
            }
          }
        })
    (activity as BaseActivity).requestSoftKeyFocus(binding.creationCodeEt)
  }

  override fun onResume() {
    super.onResume()
    registrationActivity.onAssistantClick()
    // TODO: Seperate out assistant functionality from BaseActivity
  }

  private fun handleFullCreationCode() {
    binding.creationCodeEt.isEnabled = false
    val creationCode = binding.creationCodeEt.text.toString().replace("-", "")
    verifyCreationCode(creationCode)
  }

  private fun clearErrorMessages() {
    binding.creationCodeErrorTv.text = ""
    binding.creationCodeStatusIv.setImageResource(0)
    binding.creationCodeStatusIv.setImageResource(R.drawable.ic_check_grey)
  }

  /**
   * Verify creation code. Send request to server. If successful, then move to the next activity.
   * Else set the error message appropriately.
   */
  private fun verifyCreationCode(creationCode: String) {

    lifecycleScope.launch(Dispatchers.IO) {
      val callForCreationCodeCheck = karyaAPI.checkCreationCode(creationCode)
      if (callForCreationCodeCheck.isSuccessful) {
        val response = callForCreationCodeCheck.body()!!

        // Valid creation code
        if (response.valid) {
          lifecycleScope.launch(Dispatchers.Main) {
            binding.creationCodeStatusIv.setImageResource(0)
            binding.creationCodeStatusIv.setImageResource(
                R.drawable.ic_baseline_check_circle_outline_24)
            WorkerInformation.creation_code = creationCode
            findNavController().navigate(R.id.action_creationCodeFragment_to_phoneNumberFragment)
          }
        } else {
          lifecycleScope.launch(Dispatchers.Main) {
            binding.creationCodeErrorTv.text =
                when (response.message) {
                  "invalid_creation_code" -> getString(R.string.invalid_creation_code)
                  "creation_code_already_used" -> getString(R.string.creation_code_already_used)
                  else -> "unknown error occurred"
                }
            binding.creationCodeStatusIv.setImageResource(0)
            binding.creationCodeStatusIv.setImageResource(R.drawable.ic_quit_select)
            binding.creationCodeEt.isEnabled = true
            baseActivity.requestSoftKeyFocus(binding.creationCodeEt)
          }
        }
      }
    }
  }
}
