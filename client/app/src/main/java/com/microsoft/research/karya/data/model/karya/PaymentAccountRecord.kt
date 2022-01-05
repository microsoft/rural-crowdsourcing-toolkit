package com.microsoft.research.karya.data.model.karya

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.microsoft.research.karya.data.model.karya.enums.AccountRecordStatus

@Entity(tableName = "payment_account_record")
data class PaymentAccountRecord(
  @PrimaryKey val workerId: String,
  val accountRecordId: String,
  val accountType: String,
  val failure_reason: String,
  val ifsc: String,
  val name: String,
  val status: AccountRecordStatus,
)
