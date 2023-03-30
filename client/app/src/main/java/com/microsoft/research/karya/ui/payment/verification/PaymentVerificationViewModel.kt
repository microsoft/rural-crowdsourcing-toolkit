package com.microsoft.research.karya.ui.payment.verification

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.PaymentRepository
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
class PaymentVerificationViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val paymentRepository: PaymentRepository,
) : ViewModel() {

  private val _uiStateFlow = MutableStateFlow(PaymentVerificationModel(isLoading = false, requestProcessed = false))
  val uiStateFlow = _uiStateFlow.asStateFlow()

  private val _navigationFlow = MutableSharedFlow<PaymentVerificationNavigation>()
  val navigationFlow = _navigationFlow.asSharedFlow()

  fun checkStatus() {
    viewModelScope.launch {
      _uiStateFlow.update { it.copy(isLoading = true, requestProcessed = false) }

      val worker = authManager.getLoggedInWorker()
      val idToken =
        worker.idToken
          ?: run {
            _uiStateFlow.update { it.copy(errorMessage = "Cannot find active worker, launch the app again") }
            _navigationFlow.emit(PaymentVerificationNavigation.FAILURE)
            return@launch
          }

      paymentRepository
        .getCurrentAccount(idToken)
        .catch {
          _uiStateFlow.update {
            it.copy(isLoading = false, errorMessage = "Error connecting to server", requestProcessed = false)
          }
          navigateFailure()
        }
        .collect { paymentInfoResponse ->
          paymentRepository.updatePaymentRecord(worker.id, paymentInfoResponse)
          when (paymentInfoResponse.status) {
            "INITIALISED" -> {
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = false) }
            }
            "VERIFICATION" -> {
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = true) }
            }
            "CONFIRMATION_RECEIVED" -> {
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = false) }
            }
            "VERIFIED" -> {
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = false) }
              // navigate to payment dashboard
              _navigationFlow.emit(PaymentVerificationNavigation.DASHBOARD)
            }
            "CONFIRMATION_FAILED", "REJECTED", "FAILED" -> {
              // navigate to failure
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = false) }
              navigateFailure()
            }
            else -> {
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = false) }
            }
          }
        }
    }
  }

  fun verifyAccount(confirm: Boolean) {
    viewModelScope.launch {
      val worker = authManager.getLoggedInWorker()
      val idToken =
        worker.idToken
          ?: run {
            _uiStateFlow.update { it.copy(errorMessage = "Cannot find active worker, launch the app again") }
            return@launch
          }

      val accountRecordId = paymentRepository.getAccountRecordId(worker.id)
      if (accountRecordId.isEmpty()) {
        _uiStateFlow.update {
          it.copy(
            isLoading = false,
            errorMessage = "Account id was empty, please restart the app or contact your coordinator"
          )
        }
        return@launch
      }
      _uiStateFlow.update { it.copy(isLoading = true) }
      paymentRepository
        .verifyAccount(idToken, accountRecordId, confirm)
        .catch { _navigationFlow.emit(PaymentVerificationNavigation.FAILURE) }
        .collect { paymentInfoResponse ->
          paymentRepository.updatePaymentRecord(worker.id, paymentInfoResponse)
          when (paymentInfoResponse.status) {
            "CONFIRMATION_RECEIVED" -> {
              _uiStateFlow.update { it.copy(isLoading = false, requestProcessed = false) }
            }
            "CONFIRMATION_FAILED" -> {
              navigateFailure()
            }
          }
        }
      _uiStateFlow.update { it.copy(isLoading = false) }
    }
  }

  private suspend fun navigateSuccess() = _navigationFlow.emit(PaymentVerificationNavigation.DASHBOARD)

  private suspend fun navigateFailure() = _navigationFlow.emit(PaymentVerificationNavigation.FAILURE)
}
