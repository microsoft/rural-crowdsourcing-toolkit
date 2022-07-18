package com.microsoft.research.karya.ui.payment.details.upi

data class PaymentDetailUPIModel(
  val isLoading: Boolean,
  val errorMessage: String,
  val name: String,
  val upiId: String,
  val upiIdRepeated: String
)
