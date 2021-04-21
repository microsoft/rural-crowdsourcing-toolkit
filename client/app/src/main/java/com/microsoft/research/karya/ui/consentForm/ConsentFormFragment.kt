package com.microsoft.research.karya.ui.consentForm

import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.ScrollingMovementMethod
import android.view.View
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.databinding.FragmentConsentFormBinding
import com.microsoft.research.karya.injection.ResourceModule
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.utils.viewBinding
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class ConsentFormFragment : Fragment(R.layout.fragment_consent_form) {

    private val binding by viewBinding(FragmentConsentFormBinding::bind)
    @Inject lateinit var resourceManager: ResourceManager

    // TODO: add assistant
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupViews()
    }

    private fun setupViews() {
        val consentFormText = getString(R.string.s_consent_form_text)

        val spannedText = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Html.fromHtml(consentFormText, Html.FROM_HTML_MODE_COMPACT)
        } else {
            Html.fromHtml(consentFormText)
        }

        with(binding) {
            consentFormTv.text = spannedText
            consentFormTv.movementMethod = ScrollingMovementMethod()

            agreeBtn.setOnClickListener {
                 // TODO(aditya-navana): Uncomment this once the new apis are available.
                 if (resourceManager.areLanguageResourcesAvailable(WorkerInformation.app_language!!)) {
                     navigateToRegistrationFlow()
                 } else {
                     navigateToResourceDownload()
                 }
            }

            disagreeBtn.setOnClickListener {
                requireActivity().finish()
            }
        }
    }

    private fun navigateToRegistrationFlow() {
        findNavController().navigate(R.id.action_consentFormFragment_to_registrationActivity)
    }

    private fun navigateToResourceDownload() {
        findNavController().navigate(R.id.action_consentFormFragment_to_fileDownloadFragment)
    }
}
