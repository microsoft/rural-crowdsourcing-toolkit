package com.microsoft.research.karya.ui.onboarding.consentForm

import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.ScrollingMovementMethod
import android.view.View
import androidx.fragment.app.Fragment
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.databinding.FragmentConsentFormBinding
import com.microsoft.research.karya.ui.onboarding.accesscode.AccessCodeViewModel
import com.microsoft.research.karya.utils.extensions.viewBinding
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class ConsentFormFragment : Fragment(R.layout.fragment_consent_form) {

  private val binding by viewBinding(FragmentConsentFormBinding::bind)
  private val viewModel by hiltNavGraphViewModels<AccessCodeViewModel>(R.id.access_code_nav_graph)
  @Inject lateinit var resourceManager: ResourceManager

  // TODO: add assistant
  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    Companion.setupViews(this)
  }

  private fun navigateToRegistrationFlow() {
    findNavController().navigate(R.id.action_consentFormFragment_to_registrationActivity)
  }

  private fun navigateToResourceDownload() {
    findNavController().navigate(R.id.action_consentFormFragment_to_fileDownloadFragment)
  }

  companion object {
    private fun setupViews(consentFormFragment: ConsentFormFragment) {
      val consentFormText = consentFormFragment.getString(R.string.s_consent_form_text)

      val spannedText =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          Html.fromHtml(consentFormText, Html.FROM_HTML_MODE_COMPACT)
        } else {
          Html.fromHtml(consentFormText)
        }

      with(consentFormFragment.binding) {
        appTb.setTitle(consentFormFragment.getString(R.string.s_consent_form_title))
        consentFormTv.text = spannedText
        consentFormTv.movementMethod = ScrollingMovementMethod()

        agreeBtn.setOnClickListener {
          if (consentFormFragment.resourceManager.areLanguageResourcesAvailable(
              consentFormFragment.viewModel.workerLanguage
            )
          ) {
            consentFormFragment.navigateToRegistrationFlow()
          } else {
            consentFormFragment.navigateToResourceDownload()
          }
        }

        disagreeBtn.setOnClickListener { consentFormFragment.requireActivity().finish() }
      }
    }
  }
}
