package com.microsoft.research.karya.ui.payment.verification

data class PaymentVerificationModel(
  val isLoading: Boolean,
  val requestProcessed: Boolean,
  val errorMessage: String = "",
)
