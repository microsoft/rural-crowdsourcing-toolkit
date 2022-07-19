import { AccountTaskStatus, PaymentsAccountRecord, PaymentsTransactionRecord, TransactionStatus } from '@karya/core';
import { BasicModel } from '../Index';

export async function updateStatusOnTransactionRecordUpdate(
  transactionRecord: PaymentsTransactionRecord,
  accountRecord: PaymentsAccountRecord
) {
  let newAccountStatus = accountRecord.status;
  switch (transactionRecord.status) {
    case TransactionStatus.PROCESSED:
      newAccountStatus = AccountTaskStatus.VERIFICATION;
      break;
    case TransactionStatus.REVERSED:
    case TransactionStatus.CANCELLED:
    case TransactionStatus.FAILED:
      newAccountStatus = AccountTaskStatus.INVALID;
      break;
    case TransactionStatus.FAILED_BEFORE_TRANSACTION:
    case TransactionStatus.FAILED_AFTER_TRANSACTION:
      newAccountStatus = AccountTaskStatus.FAILED;
      break;
  }
  if (newAccountStatus != accountRecord.status) {
    await BasicModel.updateSingle(
      'payments_account',
      { id: accountRecord.id },
      {
        status: newAccountStatus,
        meta: {
          ...accountRecord.meta,
          failure_reason: transactionRecord.meta ? (transactionRecord.meta as any).failure_reason : '',
        },
      }
    );
  }
}
