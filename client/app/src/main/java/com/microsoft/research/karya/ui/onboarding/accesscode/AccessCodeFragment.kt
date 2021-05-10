package com.microsoft.research.karya.ui.onboarding.accesscode

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import com.microsoft.research.karya.databinding.FragmentAccessCodeBinding
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

@AndroidEntryPoint
class AccessCodeFragment : Fragment(R.layout.fragment_access_code) {
  private val binding by viewBinding(FragmentAccessCodeBinding::bind)
  private val viewModel by viewModels<AccessCodeViewModel>()

  private val creationCodeLength = 16
  private val creationCodeEtMax = creationCodeLength + (creationCodeLength - 1) / 4

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
  }

  private fun setupViews() {
    with(binding) {
      appTb.setTitle(getString(R.string.s_access_code_title))
      /** Add text change listener to creation code */
      creationCodeEt.addTextChangedListener(
        object : SeparatorTextWatcher('-', 4) {
          override fun onAfterTextChanged(text: String, position: Int) {
            creationCodeEt.run {
              setText(text)
              setSelection(position)
            }

            /** If creation code length has reached max, call handler */
            if (creationCodeEt.length() == creationCodeEtMax) {
              // TODO: call this once the user presses the button to move forward.
              handleFullCreationCode()
            } else {
              clearErrorMessages()
            }
          }
        }
      )
      requestSoftKeyFocus(creationCodeEt)
    }
  }

  @Suppress("UNCHECKED_CAST")
  private fun checkAccessCode(accessCode: String) {
    viewModel
      .checkAccessCode(accessCode)
      .onEach { result ->
        when (result) {
          is Result.Success<*> -> onAccessCodeVerified(result.value as WorkerRecord)
          // TODO: Use error codes and exceptions from Anurag's PR
          is Result.Error -> onAccessCodeFailure(result.exception.message ?: "Error fetching data")
          Result.Loading -> showLoading()
        }
      }
      .launchIn(lifecycleScope)
  }

  private fun navigateToConsentFormFragment() {
    findNavController().navigate(R.id.action_accessCodeFragment2_to_consentFormFragment2)
  }

  private fun handleFullCreationCode() {
    binding.creationCodeEt.isEnabled = false
    val accessCode = binding.creationCodeEt.text.toString().replace("-", "")
    checkAccessCode(accessCode)
  }

  private fun onAccessCodeVerified(workerRecord: WorkerRecord) {
    hideLoading()
    showSuccessUi()

    // TODO: workerRecord.appLanguage
    updateActivityLanguage("hi")

    navigateToConsentFormFragment()
    resetViewState()
  }

  private fun onAccessCodeFailure(message: String) {
    hideLoading()
    showErrorUi(message)
  }

  private fun showSuccessUi() {
    with(binding) {
      creationCodeStatusIv.setImageResource(0)
      creationCodeStatusIv.setImageResource(R.drawable.ic_baseline_check_circle_outline_24)
    }
  }

  private fun showErrorUi(error: String) {
    with(binding) {
      creationCodeErrorTv.text = error
      creationCodeStatusIv.setImageResource(0)
      creationCodeStatusIv.setImageResource(R.drawable.ic_quit_select)
      creationCodeEt.isEnabled = true
    }
    requestSoftKeyFocus(binding.creationCodeEt)
  }

  private fun clearErrorMessages() {
    with(binding) {
      creationCodeErrorTv.text = ""
      creationCodeStatusIv.setImageResource(0)
      creationCodeStatusIv.setImageResource(R.drawable.ic_check_grey)
    }
  }

  private fun resetViewState() {
    hideLoading()
    clearErrorMessages()
    binding.creationCodeEt.isEnabled = true
    binding.creationCodeEt.text.clear()
  }

  private fun showLoading() = binding.loadingPb.visible()

  private fun hideLoading() = binding.loadingPb.gone()

  private fun updateActivityLanguage(language: String) {
    (requireActivity() as MainActivity).setActivityLocale(language)
  }
}
