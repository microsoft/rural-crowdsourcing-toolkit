package com.microsoft.research.karya.ui.payment.details.bank

data class PaymentDetailBankModel(
  val isLoading: Boolean,
  val errorMessage: String,
  val name: String,
  val ifsc: String,
  val accountNumber: String,
  val accountNumberRepeated: String
)
