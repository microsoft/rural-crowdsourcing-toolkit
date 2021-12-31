import { AccountTaskStatus, PaymentsAccountRecord, PaymentsTransactionRecord, TransactionStatus } from "@karya/core";
import { BasicModel } from "../Index";

export async function updateStatusOnTransactionRecordUpdate(
    transactionRecord: PaymentsTransactionRecord, 
    accountRecord: PaymentsAccountRecord) {

    let newAccountStatus = accountRecord.status
    console.log(newAccountStatus) 
    switch(transactionRecord.status) {
        case TransactionStatus.PROCESSED.toString():
            newAccountStatus = AccountTaskStatus.VERIFICATION
            break;
        case TransactionStatus.REVERSED.toString():
        case TransactionStatus.CANCELLED.toString():
        case TransactionStatus.FAILED.toString():
            newAccountStatus = AccountTaskStatus.INVALID
            break;
        case TransactionStatus.FAILED_KARYA.toString():
            newAccountStatus = AccountTaskStatus.FAILED
            break;
    }
    if (newAccountStatus != accountRecord.status) {
        await BasicModel.updateSingle('payments_account', { id: accountRecord.id }, { 
            status: newAccountStatus,
            meta: {
                ...accountRecord.meta,
                failure_reason: transactionRecord.meta ? (transactionRecord.meta as any).failure_reason: ""
            }
        })
    }
} 