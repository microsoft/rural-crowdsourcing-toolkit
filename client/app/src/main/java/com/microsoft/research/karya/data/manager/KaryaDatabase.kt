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
import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import com.microsoft.research.karya.data.local.daos.PolicyDao
import com.microsoft.research.karya.data.local.daos.ScenarioDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskAssignmentDaoExtra
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskDaoExtra
import com.microsoft.research.karya.data.local.ng.WorkerDao
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.PaymentRequestRecord
import com.microsoft.research.karya.data.model.karya.PayoutInfoRecord
import com.microsoft.research.karya.data.model.karya.PayoutMethodRecord
import com.microsoft.research.karya.data.model.karya.PolicyRecord
import com.microsoft.research.karya.data.model.karya.ScenarioRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord

@Database(
  entities =
    [
      ScenarioRecord::class,
      WorkerRecord::class,
      KaryaFileRecord::class,
      TaskRecord::class,
      MicroTaskRecord::class,
      PolicyRecord::class,
      MicroTaskAssignmentRecord::class,
      PayoutMethodRecord::class,
      PayoutInfoRecord::class,
      PaymentRequestRecord::class,
    ],
  views = [TaskInfo::class],
  version = 1,
  exportSchema = false
)
@TypeConverters(Converters::class)
abstract class KaryaDatabase : RoomDatabase() {
  abstract fun microTaskDao(): MicroTaskDao
  abstract fun policyDao(): PolicyDao
  abstract fun scenarioDao(): ScenarioDao
  abstract fun taskDao(): TaskDao
  abstract fun workerDao(): WorkerDao
  abstract fun microtaskAssignmentDao(): MicroTaskAssignmentDao

  abstract fun microtaskAssignmentDaoExtra(): MicrotaskAssignmentDaoExtra
  abstract fun microtaskDaoExtra(): MicrotaskDaoExtra
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
