package com.microsoft.research.karya.ui.payment.details.upi

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
import kotlinx.coroutines.flow.collect

@HiltViewModel
class PaymentDetailUPIViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val paymentRepository: PaymentRepository,
) : ViewModel() {
  private val _uiStateFlow = MutableStateFlow(PaymentDetailUPIModel(false, "", "", "", ""))
  val uiStateFlow = _uiStateFlow.asStateFlow()

  private val _navigationFlow = MutableSharedFlow<PaymentDetailNavigation>()
  val navigationFlow = _navigationFlow.asSharedFlow()

  fun submitUPIDetails(name: String, upiId: String, upiIdRepeated: String) {
    viewModelScope.launch {
      if (!validateInputs(name, upiId, upiIdRepeated)) return@launch

      _uiStateFlow.value =
        PaymentDetailUPIModel(
          isLoading = true,
          errorMessage = "",
          name = name,
          upiId = upiId,
          upiIdRepeated = upiIdRepeated
        )

      val worker = authManager.getLoggedInWorker()
      val idToken =
        worker.idToken
          ?: run {
            _uiStateFlow.update { it.copy(errorMessage = "Cannot find active worker, launch the app again") }
            return@launch
          }

      val account = Account(id = upiId, ifsc = null)
      val paymentAccountRequest = PaymentAccountRequest(account = account, name = name, type = "vpa")
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

  private fun validateInputs(name: String, upiId: String, upiIdRepeated: String): Boolean {

    if (name.length < 3) {
      _uiStateFlow.update {
        it.copy(
          isLoading = false,
          errorMessage = "Name cannot be less than 3 characters, please enter your complete name"
        )
      }
      return false
    }

    if (upiId.isEmpty() || upiIdRepeated.isEmpty()) {
      _uiStateFlow.update {
        it.copy(isLoading = false, errorMessage = "UPI id cannot be empty, please enter your UPI id")
      }
      return false
    }

    if (upiId != upiIdRepeated) {
      _uiStateFlow.update { it.copy(isLoading = false, errorMessage = "The UPI ids do not match, check the ids again") }
      return false
    }

    return true
  }
}
