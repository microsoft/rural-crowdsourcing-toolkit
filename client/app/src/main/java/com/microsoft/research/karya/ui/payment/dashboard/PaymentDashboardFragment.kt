package com.microsoft.research.karya.ui.payment.dashboard

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.databinding.FragmentPaymentDashboardBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.viewLifecycle
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach

@AndroidEntryPoint
class PaymentDashboardFragment : Fragment(R.layout.fragment_payment_dashboard) {
  private val binding by viewBinding(FragmentPaymentDashboardBinding::bind)
  private val viewModel by viewModels<PaymentDashboardViewModel>()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupListeners()
    viewModel.fetchData()
  }

  private fun setupListeners() {
    viewModel
      .navigationFlow
      .onEach { paymentDashboardNavigation -> navigate(paymentDashboardNavigation) }
      .launchIn(viewLifecycleScope)

    viewModel.uiStateFlow.observe(viewLifecycle, viewLifecycleScope) { render(it) }

    binding.transactionsButton.setOnClickListener { navigate(PaymentDashboardNavigation.TRANSACTIONS) }

    binding.updateAccountButton.setOnClickListener { navigate(PaymentDashboardNavigation.REGISTRATION) }
  }

  private fun render(paymentDashboardModel: PaymentDashboardModel) {
    if (paymentDashboardModel.isLoading) {
      showLoading()
    } else {
      with(binding) {
        balanceAmountTv.text = getString(R.string.rs_float, paymentDashboardModel.balance)
        transferredAmountTv.text = getString(R.string.rs_float, paymentDashboardModel.transferred)
        setupAccountCard(paymentDashboardModel.userAccountDetail)
        setupTransactionCard(paymentDashboardModel.userTransactionDetail)
      }
      hideLoading()
    }
  }

  private fun setupAccountCard(userAccountDetail: UserAccountDetail) {
    with(binding) {
      nameTv.text = getString(R.string.name_s, userAccountDetail.name)
      if (userAccountDetail.ifsc.isNullOrEmpty()) {
        ifscTv.text = getString(R.string.ifsc_s, "N/A")
      } else {
        ifscTv.text = getString(R.string.ifsc_s, userAccountDetail.ifsc)
      }
      accountIdTv.text = getString(R.string.id_s, userAccountDetail.id)
    }
  }

  private fun setupTransactionCard(userTransactionDetail: UserTransactionDetail) {
    with(binding) {
      amountTv.text = getString(R.string.amount_rs_2f, userTransactionDetail.amount)
      utrTv.text = getString(R.string.utr_s, userTransactionDetail.utr)
      statusTv.text = getString(R.string.status_s, userTransactionDetail.status)
      dateTv.text = getString(R.string.date_s, userTransactionDetail.date)
    }
  }

  private fun showLoading() {
    with(binding) {
      balanceTv.gone()
      balanceAmountTv.gone()
      transferredTv.gone()
      transferredAmountTv.gone()
      lastPaymentTv.gone()
      transactionCv.gone()
      accountDetailTv.gone()
      accountDetailCv.gone()

      progressBar.visible()
    }
  }

  private fun hideLoading() {
    with(binding) {
      balanceTv.visible()
      balanceAmountTv.visible()
      transferredTv.visible()
      transferredAmountTv.visible()
      lastPaymentTv.visible()
      transactionCv.visible()
      accountDetailTv.visible()
      accountDetailCv.visible()

      progressBar.gone()
    }
  }

  private fun navigate(paymentDashboardNavigation: PaymentDashboardNavigation) {
    val resId =
      when (paymentDashboardNavigation) {
        PaymentDashboardNavigation.TRANSACTIONS -> R.id.action_paymentDashboardFragment_to_paymentTransactionFragment
        PaymentDashboardNavigation.REGISTRATION -> R.id.action_paymentDashboardFragment_to_paymentRegistrationFragment
      }
    findNavController().navigate(resId)
  }
}
