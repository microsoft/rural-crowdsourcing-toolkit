package com.microsoft.research.karya.ui.payment.dashboard

data class PaymentDashboardModel(
  val balance: Float,
  val transferred: Float,
  val isLoading: Boolean,
  val errorMessage: String,
  val userAccountDetail: UserAccountDetail,
  val userTransactionDetail: UserTransactionDetail
) {
  companion object {
    fun initialModel() =
      PaymentDashboardModel(
        balance = 0.0f,
        transferred = 0.0f,
        isLoading = false,
        errorMessage = "",
        userAccountDetail = UserAccountDetail(name = "", id = "", accountType = "", ifsc = ""),
        userTransactionDetail = UserTransactionDetail(
          amount = 0.0f,
          utr = "",
          date = "",
          status = ""
        )
      )
  }
}
