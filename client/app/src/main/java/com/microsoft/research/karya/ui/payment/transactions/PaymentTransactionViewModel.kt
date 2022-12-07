package com.microsoft.research.karya.ui.payment.transactions

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.ui.payment.dashboard.UserTransactionDetail
import dagger.hilt.android.lifecycle.HiltViewModel
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect

@HiltViewModel
class PaymentTransactionViewModel
@Inject
constructor(private val authManager: AuthManager, private val paymentRepository: PaymentRepository) : ViewModel() {

  private val _uiStateFlow = MutableStateFlow(PaymentTransactionModel.initialModel())
  val uiStateFlow = _uiStateFlow.asStateFlow()

  fun fetchTransactions() {
    viewModelScope.launch {
      _uiStateFlow.update { it.copy(isLoading = true) }
      val worker = authManager.getLoggedInWorker()
      val idToken =
        worker.idToken
          ?: run {
            _uiStateFlow.update { it.copy(errorMessage = "Cannot find active worker, launch the app again") }
            return@launch
          }

      paymentRepository
        .getTransactions(idToken, worker.id)
        .catch { _uiStateFlow.update { it.copy(isLoading = false, errorMessage = "Error fetching transactions") } }
        .collect { list ->
          val transactionList =
            list.map { transaction ->
              val parsedDateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
              val transactionDate = parsedDateFormat.parse(transaction.createdAt)
              val userDateFormat = SimpleDateFormat("dd-MM-yyyy")
              val userDate = userDateFormat.format(transactionDate)

              UserTransactionDetail(
                amount = transaction.amount,
                utr = transaction.utr,
                date = userDate ?: "",
                status = transaction.status
              )
            }
          _uiStateFlow.update {
            it.copy(isLoading = false, errorMessage = "", userTransactionDetailList = transactionList)
          }
        }
    }
  }
}
