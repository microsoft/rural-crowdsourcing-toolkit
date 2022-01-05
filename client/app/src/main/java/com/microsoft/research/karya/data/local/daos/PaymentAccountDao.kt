package com.microsoft.research.karya.data.local.daos

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Transaction
import com.microsoft.research.karya.data.model.karya.PaymentAccountRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord
import com.microsoft.research.karya.data.model.karya.enums.AccountRecordStatus

@Dao
interface PaymentAccountDao : BasicDao<PaymentAccountRecord> {

    @Query("SELECT COUNT(*) FROM payment_account_record")
    suspend fun getPaymentRecordCount(): Int

    @Query("SELECT * FROM payment_account_record")
    suspend fun getAllPaymentRecords(): List<PaymentAccountRecord>

    @Query("SELECT status from payment_account_record where workerId is :workerId")
    suspend fun getStatusForWorkerId(workerId: String): AccountRecordStatus

    @Query("SELECT accountRecordId from payment_account_record where workerId is :workerId")
    suspend fun getAccountRecordIdForWorkerId(workerId: String): String

    @Transaction
    suspend fun upsert(record: PaymentAccountRecord) {
        insertForUpsert(record)
        updateForUpsert(record)
    }
}
