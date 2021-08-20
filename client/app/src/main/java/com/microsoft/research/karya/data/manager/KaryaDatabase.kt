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
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskAssignmentDaoExtra
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskDaoExtra
import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.model.karya.KaryaFileRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskAssignmentRecord
import com.microsoft.research.karya.data.model.karya.MicroTaskRecord
import com.microsoft.research.karya.data.model.karya.TaskRecord
import com.microsoft.research.karya.data.model.karya.WorkerRecord

@Database(
  entities =
  [
    WorkerRecord::class,
    KaryaFileRecord::class,
    TaskRecord::class,
    MicroTaskRecord::class,
    MicroTaskAssignmentRecord::class,
  ],
  version = 1,
  //  autoMigrations = [
  //    AutoMigration (from = 1, to = 2)
  //  ]
)
@TypeConverters(Converters::class)
abstract class KaryaDatabase : RoomDatabase() {
  abstract fun microTaskDao(): MicroTaskDao
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
          INSTANCE =
            Room.databaseBuilder(context.applicationContext, KaryaDatabase::class.java, "karya.db")
              .build()
        }
      }
      return INSTANCE
    }
  }
}
