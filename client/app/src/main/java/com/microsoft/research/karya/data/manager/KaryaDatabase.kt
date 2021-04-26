// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.microsoft.research.karya.data.local.Converters
import com.microsoft.research.karya.data.local.daos.KaryaFileDao
import com.microsoft.research.karya.data.local.daos.LanguageDao
import com.microsoft.research.karya.data.local.daos.MicrotaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.MicrotaskDao
import com.microsoft.research.karya.data.local.daos.PolicyDao
import com.microsoft.research.karya.data.local.daos.ScenarioDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.local.daosExtra.LanguageDaoExtra
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskAssignmentDaoExtra
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskDaoExtra
import com.microsoft.research.karya.data.local.daosExtra.WorkerDaoExtra
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.model.karya.LanguageRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicrotaskRecord
import com.microsoft.research.karya.data.model.karya.PaymentRequestRecord
import com.microsoft.research.karya.data.model.karya.PayoutInfoRecord
import com.microsoft.research.karya.data.model.karya.PayoutMethodRecord
import com.microsoft.research.karya.data.model.karya.PolicyRecord
import com.microsoft.research.karya.data.model.karya.ScenarioRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord

@Database(
  entities =
    [
      LanguageRecord::class,
      ScenarioRecord::class,
      WorkerRecord::class,
      KaryaFileRecord::class,
      TaskRecord::class,
      MicrotaskRecord::class,
      PolicyRecord::class,
      MicrotaskAssignmentRecord::class,
      PayoutMethodRecord::class,
      PayoutInfoRecord::class,
      PaymentRequestRecord::class],
  version = 5,
  exportSchema = false
)
@TypeConverters(Converters::class)
abstract class KaryaDatabase : RoomDatabase() {
  abstract fun languageDao(): LanguageDao
  abstract fun microTaskDao(): MicrotaskDao
  abstract fun policyDao(): PolicyDao
  abstract fun scenarioDao(): ScenarioDao
  abstract fun taskDao(): TaskDao
  abstract fun workerDao(): WorkerDao
  abstract fun microtaskAssignmentDao(): MicrotaskAssignmentDao

  abstract fun languageDaoExtra(): LanguageDaoExtra
  abstract fun microtaskAssignmentDaoExtra(): MicrotaskAssignmentDaoExtra
  abstract fun microtaskDaoExtra(): MicrotaskDaoExtra
  abstract fun workerDaoExtra(): WorkerDaoExtra
  abstract fun karyaFileDao(): KaryaFileDao

  companion object {
    private var INSTANCE: KaryaDatabase? = null

    fun getInstance(context: Context): KaryaDatabase? {
      if (INSTANCE == null) {
        synchronized(KaryaDatabase::class) {
          INSTANCE = Room.databaseBuilder(context.applicationContext, KaryaDatabase::class.java, "karya.db").build()
        }
      }
      return INSTANCE
    }
  }
}
