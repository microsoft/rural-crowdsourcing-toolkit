package com.microsoft.research.karya.ui.onboarding.consentForm

import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.ScrollingMovementMethod
import android.view.View
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.databinding.FragmentConsentFormBinding
import com.microsoft.research.karya.utils.extensions.viewBinding
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.launch

@AndroidEntryPoint
class ConsentFormFragment : Fragment(R.layout.fragment_consent_form) {

  private val binding by viewBinding(FragmentConsentFormBinding::bind)

  @Inject lateinit var resourceManager: ResourceManager

  @Inject lateinit var authManager: AuthManager

  // TODO: add assistant
  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
  }

  private fun setupViews() {
    val consentFormText = getString(R.string.s_consent_form_text)

    val spannedText =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        Html.fromHtml(consentFormText, Html.FROM_HTML_MODE_COMPACT)
      } else {
        Html.fromHtml(consentFormText)
      }

    with(binding) {
      appTb.setTitle(getString(R.string.s_consent_form_title))
      consentFormTv.text = spannedText
      consentFormTv.movementMethod = ScrollingMovementMethod()

      agreeBtn.setOnClickListener { handleNavigation() }

      disagreeBtn.setOnClickListener { requireActivity().finish() }
    }
  }

  private fun handleNavigation() {
    viewLifecycleOwner.lifecycleScope.launch {
      val worker = authManager.fetchLoggedInWorker()

      if (resourceManager.areLanguageResourcesAvailable(worker.appLanguage)) {
        navigateToLoginFlow()
      } else {
        navigateToResourceDownload()
      }
    }
  }

  private fun navigateToLoginFlow() {
    findNavController().navigate(R.id.action_consentFormFragment2_to_loginFlow)
  }

  private fun navigateToResourceDownload() {
    findNavController().navigate(R.id.action_consentFormFragment2_to_fileDownloadFragment2)
  }
}
