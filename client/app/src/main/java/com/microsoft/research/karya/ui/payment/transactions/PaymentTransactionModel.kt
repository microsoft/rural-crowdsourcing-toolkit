package com.microsoft.research.karya.ui.payment.transactions

import com.microsoft.research.karya.ui.payment.dashboard.UserTransactionDetail

data class PaymentTransactionModel(
  val isLoading: Boolean,
  val errorMessage: String,
  val userTransactionDetailList: List<UserTransactionDetail>
) {
  companion object {
    fun initialModel() =
      PaymentTransactionModel(isLoading = false, errorMessage = "", userTransactionDetailList = listOf())
  }
}
