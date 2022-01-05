package com.microsoft.research.karya.ui.payment.failure

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.View
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentPaymentFailureBinding
import com.microsoft.research.karya.databinding.FragmentPaymentVerificationBinding
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

@AndroidEntryPoint
class PaymentFailureFragment : Fragment(R.layout.fragment_payment_failure) {
    private val binding by viewBinding(FragmentPaymentFailureBinding::bind)
    private val viewModel by viewModels<PaymentFailureViewModel>()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupListeners()
    }

    private fun setupListeners() {
        binding.registerButton.setOnClickListener {
            navigateToRegistration()
        }

        binding.backButton.setOnClickListener {
            navigateToDashboard()
        }

        viewModel.uiStateFlow.observe(viewLifecycle, viewLifecycleScope) { paymentModel ->
            render(paymentModel)
        }

        viewModel.navigationFlow.onEach { navigation ->
            when (navigation) {
                PaymentFailureNavigation.DASHBOARD -> navigateToDashboard()
                PaymentFailureNavigation.REGISTRATION -> navigateToRegistration()
            }
        }.launchIn(viewLifecycleScope)
    }

    private fun render(paymentVerificationModel: PaymentFailureModel) {
    }

    private fun navigateToDashboard() {
        findNavController().navigate(R.id.action_paymentFailureFragment_to_dashboardActivity)
    }

    private fun navigateToRegistration() {
        findNavController().navigate(R.id.action_paymentFailureFragment_to_paymentRegistrationFragment)
    }

    companion object {
        fun newInstance() = PaymentFailureFragment()
    }
}
