package com.microsoft.research.karya.ui.payment.details.bank

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentPaymentDetailsBankBinding
import com.microsoft.research.karya.ui.payment.details.PaymentDetailNavigation
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.hideKeyboard
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

@AndroidEntryPoint
class PaymentDetailBankFragment : Fragment(R.layout.fragment_payment_details_bank) {

    private val binding by viewBinding(FragmentPaymentDetailsBankBinding::bind)
    private val viewModel by viewModels<PaymentDetailBankViewModel>()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupListeners()
    }

    private fun setupListeners() {
        binding.submitButton.setOnClickListener {
            with(binding) {
                hideKeyboard()
                viewModel.submitBankDetails(
                    nameEt.text.toString(),
                    ifscCodeEt.text.toString(),
                    accountNumberEt.text.toString(),
                    accountNumberRepeatEt.text.toString()
                )
            }
        }

        viewModel.uiStateFlow.observe(lifecycle, viewLifecycleScope) { paymentModel ->
            render(paymentModel)
        }

        viewModel.navigationFlow.onEach { paymentDetailNavigation ->
            when(paymentDetailNavigation) {
                PaymentDetailNavigation.VERIFICATION -> navigateToVerification()
                PaymentDetailNavigation.FAILURE -> navigateToFailure()
            }
        }.launchIn(viewLifecycleScope)
    }

    private fun render(paymentDetailBankModel: PaymentDetailBankModel) {
        if (paymentDetailBankModel.isLoading) {
            with(binding) {
                progressBar.visible()
                submitButton.gone()
                errorTv.gone()
                errorTv.text = ""
            }
        }

        if (paymentDetailBankModel.errorMessage.isNotEmpty()) {
            with(binding) {
                progressBar.gone()
                submitButton.visible()
                errorTv.visible()
                errorTv.text = paymentDetailBankModel.errorMessage
            }
        }
    }

    private fun navigateToVerification() {
        findNavController().navigate(R.id.action_paymentDetailBankFragment_to_paymentVerificationFragment)
    }

    private fun navigateToFailure() {
        findNavController().navigate(R.id.action_global_paymentFailureFragment)
    }

    companion object {
        fun newInstance() = PaymentDetailBankFragment()
    }
}
