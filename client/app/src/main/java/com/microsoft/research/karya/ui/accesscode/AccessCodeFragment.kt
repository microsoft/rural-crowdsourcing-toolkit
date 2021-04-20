package com.microsoft.research.karya.ui.accesscode

import android.os.Bundle
import android.view.View
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentAccessCodeBinding
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.SeparatorTextWatcher
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.requestSoftKeyFocus
import com.microsoft.research.karya.utils.extensions.visible
import com.microsoft.research.karya.utils.viewBinding
import kotlinx.coroutines.launch

class AccessCodeFragment : Fragment(R.layout.fragment_access_code) {
    private val binding by viewBinding(FragmentAccessCodeBinding::bind)
    private val viewModel by activityViewModels<AccessCodeViewModel>()

    private val creationCodeLength = 16
    private val creationCodeEtMax = creationCodeLength + (creationCodeLength - 1) / 4

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupViews()
    }

    private fun setupViews() {
        with(binding) {
            /** Add text change listener to creation code */
            creationCodeEt.addTextChangedListener(object : SeparatorTextWatcher('-', 4) {
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
            })
            requestSoftKeyFocus(creationCodeEt)
        }
    }

    private fun checkAccessCode(accessCode: String) {
        viewModel.checkAccessCode(accessCode).observe(lifecycle, lifecycleScope) { result ->
            when (result) {
                is Result.Success<*> -> onAccessCodeVerified(result as Result.Success<Int>, accessCode)
                // TODO: Use error codes and exceptions from Anurag's PR
                is Result.Error -> showErrorMessage(result.exception.message ?: "Error fetching data")
                Result.Loading -> showLoading()
            }
        }
    }

    private fun onAccessCodeVerified(successResult: Result.Success<Int>, accessCode: String) {
        showSuccessMessage()
        lifecycleScope.launch { updateLanguagePreference(successResult.value) }
        WorkerInformation.creation_code = accessCode
        findNavController().navigate(R.id.action_accessCodeFragment_to_consentFormFragment)
    }

    private fun onAccessCodeFailure(message: String) {
        showErrorMessage(message)
    }

    private suspend fun updateLanguagePreference(newLanguage: Int) {
        val languagePrefKey = intPreferencesKey(PreferenceKeys.APP_LANGUAGE)
        requireContext().dataStore.edit { prefs ->
            prefs[languagePrefKey] = newLanguage
        }
    }

    private fun navigateToConsentFormFragment() {
    }

    private fun handleFullCreationCode() {
        binding.creationCodeEt.isEnabled = false
        val accessCode = binding.creationCodeEt.text.toString().replace("-", "")
        checkAccessCode(accessCode)
    }

    private fun showSuccessMessage() {
        with(binding) {
            creationCodeStatusIv.setImageResource(0)
            creationCodeStatusIv.setImageResource(R.drawable.ic_baseline_check_circle_outline_24)
        }

        hideLoading()
    }

    private fun showErrorMessage(error: String) {
        with(binding) {
            creationCodeErrorTv.text = error
            creationCodeStatusIv.setImageResource(0)
            creationCodeStatusIv.setImageResource(R.drawable.ic_quit_select)
            creationCodeEt.isEnabled = true
        }

        hideLoading()
        requestSoftKeyFocus(binding.creationCodeEt)
    }

    private fun clearErrorMessages() {
        with(binding) {
            creationCodeErrorTv.text = ""
            creationCodeStatusIv.setImageResource(0)
            creationCodeStatusIv.setImageResource(R.drawable.ic_check_grey)
        }
    }

    private fun showLoading() = binding.loadingPb.visible()

    private fun hideLoading() = binding.loadingPb.gone()
}
