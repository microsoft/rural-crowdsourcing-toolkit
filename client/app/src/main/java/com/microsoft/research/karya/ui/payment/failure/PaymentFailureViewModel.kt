package com.microsoft.research.karya.ui.payment.failure

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow

class PaymentFailureViewModel : ViewModel() {

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
}
