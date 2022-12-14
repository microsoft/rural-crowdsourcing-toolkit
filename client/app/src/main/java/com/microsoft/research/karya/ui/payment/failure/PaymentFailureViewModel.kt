package com.microsoft.research.karya.ui.payment.failure

import androidx.lifecycle.ViewModel
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.repo.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import javax.inject.Inject

@HiltViewModel
class PaymentFailureViewModel
@Inject
constructor(
  private val authManager: AuthManager,
  private val paymentRepository: PaymentRepository
) : ViewModel() {
  private val _uiStateFlow = MutableStateFlow(PaymentFailureModel(false))
  val uiStateFlow = _uiStateFlow.asStateFlow()

  private val _navigationFlow = MutableSharedFlow<PaymentFailureNavigation>()
  val navigationFlow = _navigationFlow.asSharedFlow()

  fun navigateDashboard() {
    _navigationFlow.tryEmit(PaymentFailureNavigation.DASHBOARD)
  }

  fun navigateRegistration() {
    _navigationFlow.tryEmit(PaymentFailureNavigation.REGISTRATION)
  }

  suspend fun getFailureReason(): String? {
    val workerIdToken = authManager.getLoggedInWorker().idToken
    var failureReason: String? = null
    paymentRepository.getCurrentAccount(workerIdToken!!)
      .catch { e -> failureReason = e.message }
      .collect { response ->
        failureReason = response.meta!!.failure_reason ?: ""
      }
    return failureReason
  }
}
