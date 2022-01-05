package com.microsoft.research.karya.data.model.karya.enums

import androidx.annotation.Keep
import com.microsoft.research.karya.ui.payment.PaymentFlowNavigation

@Keep
enum class AccountRecordStatus(val status: String) {
    CONFIRMATION_FAILED("CONFIRMATION_FAILED"),
    REJECTED("REJECTED"),
    FAILED("FAILED"),
    INVALID("INVALID"),
    UNINITIALISED("UNINITIALISED"),
    INITIALISED("INITIALISED"),
    BOX_ACCOUNTS_QUEUE("BOX_ACCOUNTS_QUEUE"),
    SERVER_API("SERVER_API"),
    SERVER_ACCOUNTS_QUEUE("SERVER_ACCOUNTS_QUEUE"),
    TRANSACTION_QUEUE("TRANSACTION_QUEUE"),
    TRANSACTION_CREATED("TRANSACTION_CREATED"),
    VERIFICATION("VERIFICATION"),
    CONFIRMATION_RECEIVED("CONFIRMATION_RECEIVED"),
    VERIFIED("VERIFIED"),
    ;

    fun getNavigationDestination(): PaymentFlowNavigation {
        return when (this) {
            CONFIRMATION_FAILED, REJECTED, FAILED, INVALID -> PaymentFlowNavigation.FAILURE
            UNINITIALISED -> PaymentFlowNavigation.REGISTRATION
            INITIALISED, BOX_ACCOUNTS_QUEUE, SERVER_API, SERVER_ACCOUNTS_QUEUE, TRANSACTION_QUEUE, TRANSACTION_CREATED, CONFIRMATION_RECEIVED, VERIFICATION -> PaymentFlowNavigation.VERIFICATION
            VERIFIED -> PaymentFlowNavigation.DASHBOARD
        }
    }
}
