package com.microsoft.research.karya.ui.payment.registration

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.AssignmentRepository
import com.microsoft.research.karya.data.repo.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

@HiltViewModel
class PaymentRegistrationViewModel
@Inject
constructor(private val authManager: AuthManager, private val paymentRepository: PaymentRepository, private val assignmentRepository: AssignmentRepository) : ViewModel() {

  private val _uiStateFlow = MutableStateFlow(PaymentRegistrationModel(0.0f, PaymentMethod.NONE))
  val uiStateFlow = _uiStateFlow.asStateFlow()

  init {
    viewModelScope.launch {
      val worker = authManager.getLoggedInWorker()
      val workerBalanceResponse =
        paymentRepository
          .getWorkerEarnings()
      _uiStateFlow.update { it.copy(amountEarned = workerBalanceResponse.totalEarned) }
    }
  }

  fun selectPaymentMethod(paymentMethod: PaymentMethod) {
    _uiStateFlow.update { it.copy(selection = paymentMethod) }
  }
}
