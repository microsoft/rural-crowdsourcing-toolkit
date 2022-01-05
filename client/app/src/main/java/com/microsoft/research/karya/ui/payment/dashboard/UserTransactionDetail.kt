package com.microsoft.research.karya.ui.payment.dashboard

data class UserTransactionDetail(
  val amount: Float,
  val utr: String? = "",
  val date: String,
  val status: String,
)
