package com.microsoft.research.karya.ui.payment.dashboard

data class UserAccountDetail(
  val name: String,
  val id: String,
  // TODO: handle vpa
  val ifsc: String? = "",
)
