package com.microsoft.research.karya.ui.payment.details.bank

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.remote.request.Account
import com.microsoft.research.karya.data.remote.request.PaymentAccountRequest
import com.microsoft.research.karya.data.repo.PaymentRepository
import com.microsoft.research.karya.ui.payment.details.PaymentDetailNavigation
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class PaymentDetailBankViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val paymentRepository: PaymentRepository,
) : ViewModel() {
  private val _uiStateFlow = MutableStateFlow(PaymentDetailBankModel(false, "", "", "", "", ""))
  val uiStateFlow = _uiStateFlow.asStateFlow()

  private val _navigationFlow = MutableSharedFlow<PaymentDetailNavigation>()
  val navigationFlow = _navigationFlow.asSharedFlow()

  fun submitBankDetails(name: String, ifsc: String, accountNumber: String, accountNumberRepeated: String) {
    viewModelScope.launch {
      if (!validateInputs(name, ifsc, accountNumber, accountNumberRepeated)) return@launch

      _uiStateFlow.update {
        it.copy(
          isLoading = true,
          errorMessage = "",
          name = name,
          ifsc = ifsc,
          accountNumber = accountNumber,
          accountNumberRepeated = accountNumberRepeated
        )
      }

      val worker = authManager.getLoggedInWorker()
      val idToken =
        worker.idToken
          ?: run {
            _uiStateFlow.update { it.copy(errorMessage = "Cannot find active worker, launch the app again") }
            return@launch
          }

      val account = Account(id = accountNumber, ifsc = ifsc)
      val paymentAccountRequest = PaymentAccountRequest(account = account, name = name, type = "bank_account")
      paymentRepository
        .addAccount(idToken, paymentAccountRequest)
        .catch {
          _uiStateFlow.update { it.copy(isLoading = false, errorMessage = "Some error occurRed") }
          _navigationFlow.emit(PaymentDetailNavigation.FAILURE)
        }
        .collect { paymentInfoResponse ->
          paymentRepository.updatePaymentRecord(workerId = worker.id, paymentInfoResponse)
          _uiStateFlow.update { it.copy(isLoading = false, errorMessage = "") }
          if (paymentInfoResponse.status != "FAILED") {
            _navigationFlow.emit(PaymentDetailNavigation.VERIFICATION)
          } else {
            _navigationFlow.emit(PaymentDetailNavigation.FAILURE)
          }
        }
    }
  }

  private fun validateInputs(
    name: String,
    ifsc: String,
    accountNumber: String,
    accountNumberRepeated: String
  ): Boolean {

    if (name.length < 3) {
      _uiStateFlow.update {
        it.copy(
          isLoading = false,
          errorMessage = "Name cannot be less than 3 characters, please enter your complete name"
        )
      }
      return false
    }

    if (ifsc.isEmpty() || ifsc.length < 11) {
      _uiStateFlow.update {
        it.copy(isLoading = false, errorMessage = "ifsc should be 11 characters long, please check your ifsc code")
      }
      return false
    }

    if (accountNumber.isEmpty() || accountNumberRepeated.isEmpty()) {
      _uiStateFlow.update {
        it.copy(isLoading = false, errorMessage = "account number cannot be empty, please enter your account number")
      }
      return false
    }

    if (accountNumber != accountNumberRepeated) {
      _uiStateFlow.update {
        it.copy(isLoading = false, errorMessage = "The account numbers do not match, check accounts again")
      }
      return false
    }

    return true
  }
}
