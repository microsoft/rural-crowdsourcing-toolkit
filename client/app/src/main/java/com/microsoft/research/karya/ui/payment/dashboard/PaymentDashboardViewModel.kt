package com.microsoft.research.karya.ui.payment.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class PaymentDashboardViewModel
@Inject
constructor(private val authManager: AuthManager, private val paymentRepository: PaymentRepository) : ViewModel() {

  private val _uiStateFlow = MutableStateFlow(PaymentDashboardModel.initialModel())
  val uiStateFlow = _uiStateFlow.asStateFlow()

  private val _navigationFlow = MutableSharedFlow<PaymentDashboardNavigation>()
  val navigationFlow = _navigationFlow.asSharedFlow()

  private var transactionsCache = listOf<UserTransactionDetail>()

  fun fetchData() {
    viewModelScope.launch {
      _uiStateFlow.update { it.copy(isLoading = true) }
      val worker = authManager.getLoggedInWorker()
      val idToken =
        worker.idToken
          ?: run {
            _uiStateFlow.update { it.copy(errorMessage = "Cannot find active worker, launch the app again") }
            return@launch
          }

      val currentAccountFlow = paymentRepository.getCurrentAccount(idToken)
      val balanceFlow = paymentRepository.getWorkerBalance(idToken, worker.id)
      val transactionsFlow = paymentRepository.getTransactions(idToken, worker.id)

      val combinedFlow =
        combine(currentAccountFlow, balanceFlow, transactionsFlow) {
          paymentInfoResponse,
          workerBalanceResponse,
          transactions ->
          val transaction = transactions.first()

          val ifsc = paymentInfoResponse.meta!!.account.ifsc ?: ""
          val idPrefix = if (ifsc.isEmpty()) "xxxxxx@xx" else "XXXXXXXXXXXX"
          val userAccountDetail =
            UserAccountDetail(
              name = paymentInfoResponse.meta.name,
              id = idPrefix + paymentInfoResponse.meta.account.id,
              ifsc = ifsc,
            )
          val parsedDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
          val transactionDate = parsedDateFormat.parse(transaction.createdAt)
          val userDateFormat = SimpleDateFormat("dd-MM-yyyy")
          val userDate = userDateFormat.format(transactionDate)

          val userTransactionDetail =
            UserTransactionDetail(
              amount = transaction.amount.toFloat(),
              utr = transaction.utr,
              date = userDate ?: "",
              status = transaction.status
            )

          PaymentDashboardModel(
            balance = workerBalanceResponse.workerBalance,
            transferred = workerBalanceResponse.totalSpent,
            userAccountDetail = userAccountDetail,
            userTransactionDetail = userTransactionDetail,
            isLoading = false,
            errorMessage = ""
          )
        }

      combinedFlow
        .catch { e -> _uiStateFlow.update { it.copy(isLoading = false, errorMessage = "Some error occurred") } }
        .collect { paymentDashboardModel ->
          Log.e("PAYMENT_DASHBOARD", "In Collect")
          _uiStateFlow.update { paymentDashboardModel }
        }
    }
  }
}
