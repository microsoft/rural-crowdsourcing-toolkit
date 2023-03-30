package com.microsoft.research.karya.ui.payment.registration

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentPaymentRegistrationBinding
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class PaymentRegistrationFragment : Fragment(R.layout.fragment_payment_registration) {

  private val binding by viewBinding(FragmentPaymentRegistrationBinding::bind)
  private val viewModel by viewModels<PaymentRegistrationViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupListeners()
  }

  private fun setupListeners() {
    binding.bankLL.setOnClickListener {
      viewModel.selectPaymentMethod(PaymentMethod.BANK_ACCOUNT)
      navigateToDetails(PaymentMethod.BANK_ACCOUNT)
    }

    binding.upiLL.setOnClickListener {
      viewModel.selectPaymentMethod(PaymentMethod.UPI)
      navigateToDetails(PaymentMethod.UPI)
    }

    viewModel.uiStateFlow.observe(viewLifecycle, viewLifecycleScope) { paymentModel -> render(paymentModel) }
  }

  private fun render(paymentRegistrationModel: PaymentRegistrationModel) {
    when (paymentRegistrationModel.selection) {
      PaymentMethod.NONE -> {
        binding.bankIv.isSelected = false
        binding.upiIv.isSelected = false
      }
      PaymentMethod.BANK_ACCOUNT -> {
        binding.bankIv.isSelected = true
        binding.upiIv.isSelected = false
      }
      PaymentMethod.UPI -> {
        binding.bankIv.isSelected = false
        binding.upiIv.isSelected = true
      }
    }

    binding.description.text =
      getString(R.string.payment_registration_description, paymentRegistrationModel.amountEarned)
  }

  private fun navigateToDetails(paymentMethod: PaymentMethod) {
    val action =
      when (paymentMethod) {
        PaymentMethod.NONE -> return
        PaymentMethod.BANK_ACCOUNT -> R.id.action_paymentRegistrationFragment_to_paymentDetailBankFragment
        PaymentMethod.UPI -> R.id.action_paymentRegistrationFragment_to_paymentDetailUPIFragment
      }

    findNavController().navigate(action)
  }

  companion object {
    fun newInstance() = PaymentRegistrationFragment()
  }
}
