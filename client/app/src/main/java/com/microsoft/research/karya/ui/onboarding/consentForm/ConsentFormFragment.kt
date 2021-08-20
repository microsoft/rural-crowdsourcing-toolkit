package com.microsoft.research.karya.ui.onboarding.consentForm

import android.os.Build
import android.os.Bundle
import android.text.Html
import android.text.method.ScrollingMovementMethod
import android.view.View
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.AssistantAudio
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.databinding.FragmentConsentFormBinding
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class ConsentFormFragment : BaseFragment(R.layout.fragment_consent_form) {

  private val binding by viewBinding(FragmentConsentFormBinding::bind)
  private val viewModel by viewModels<ConsentFormViewModel>()

  @Inject
  lateinit var resourceManager: ResourceManager
  @Inject
  lateinit var authManager: AuthManager

  // TODO: add assistant
  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()
    observeEffects()
  }

  override fun onResume() {
    super.onResume()
    assistant.playAssistantAudio(AssistantAudio.CONSENT_FORM_SUMMARY)
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
      appTb.setAssistantClickListener { assistant.playAssistantAudio(AssistantAudio.CONSENT_FORM_SUMMARY) }

      consentFormTv.text = spannedText
      consentFormTv.movementMethod = ScrollingMovementMethod()

      agreeBtn.setOnClickListener { viewModel.updateConsentFormStatus(true) }

      disagreeBtn.setOnClickListener { requireActivity().finish() }
    }
  }

  private fun observeUi() {
    viewModel.consentFormUiState.observe(viewLifecycle, viewLifecycleScope) { state ->
      when (state) {
        is ConsentFormUiState.Error -> showErrorUi()
        ConsentFormUiState.Initial -> showInitialUi()
        ConsentFormUiState.Loading -> showLoadingUi()
        ConsentFormUiState.Success -> showSuccessUi()
      }
    }
  }

  private fun observeEffects() {
    viewModel.consentFormEffects.observe(viewLifecycle, viewLifecycleScope) { effect ->
      when (effect) {
        ConsentFormEffects.Navigate -> navigateToLoginFlow()
      }
    }
  }

  private fun showInitialUi() {
    with(binding) {
      agreeBtn.isClickable = true
      disagreeBtn.isClickable = true

      agreeBtn.enable()
      disagreeBtn.enable()
    }
  }

  private fun showLoadingUi() {
    with(binding) {
      agreeBtn.isClickable = false
      disagreeBtn.isClickable = false

      agreeBtn.disable()
      disagreeBtn.disable()
    }
  }

  private fun showSuccessUi() {
    with(binding) {
      agreeBtn.isClickable = true
      disagreeBtn.isClickable = true

      agreeBtn.enable()
      disagreeBtn.enable()
    }
  }

  private fun showErrorUi() {
    with(binding) {
      agreeBtn.isClickable = true
      disagreeBtn.isClickable = true

      agreeBtn.enable()
      disagreeBtn.enable()
    }
  }

  private fun navigateToLoginFlow() {
    findNavController().navigate(R.id.action_consentFormFragment2_to_loginFlow)
  }
}
