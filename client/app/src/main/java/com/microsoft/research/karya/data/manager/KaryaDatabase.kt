// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.microsoft.research.karya.data.local.Converters
import com.microsoft.research.karya.data.model.karya.LanguageRecord
import com.microsoft.research.karya.data.model.karya.LanguageResourceRecord
import com.microsoft.research.karya.data.model.karya.ScenarioRecord
import com.microsoft.research.karya.data.local.daos.*
import com.microsoft.research.karya.data.local.daosExtra.*
import com.microsoft.research.karya.data.model.karya.*

@Database(
    entities = [
        LanguageRecord::class,
        ScenarioRecord::class,
        LanguageResourceRecord::class,
        LanguageResourceValueRecord::class,
        WorkerRecord::class,
        KaryaFileRecord::class,
        TaskRecord::class,
        MicrotaskGroupRecord::class,
        MicrotaskRecord::class,
        PolicyRecord::class,
        TaskAssignmentRecord::class,
        WorkerLanguageSkillRecord::class,
        MicrotaskGroupAssignmentRecord::class,
        MicrotaskAssignmentRecord::class,
        PayoutMethodRecord::class,
        PayoutInfoRecord::class,
        PaymentRequestRecord::class
    ], version = 4, exportSchema = false
)
@TypeConverters(Converters::class)
abstract class KaryaDatabase : RoomDatabase() {
    abstract fun languageDao(): LanguageDao
    abstract fun microTaskDao(): MicrotaskDao
    abstract fun policyDao(): PolicyDao
    abstract fun scenarioDao(): ScenarioDao
    abstract fun taskDao(): TaskDao
    abstract fun workerDao(): WorkerDao
    abstract fun languageResourceDao(): LanguageResourceDao
    abstract fun languageResourceValueDao(): LanguageResourceValueDao
    abstract fun workerLanguageSkillDao(): WorkerLanguageSkillDao
    abstract fun microtaskAssignmentDao(): MicrotaskAssignmentDao
    abstract fun microtaskGroupAssignmentDao(): MicrotaskGroupAssignmentDao
    abstract fun microtaskGroupDao(): MicrotaskGroupDao
    abstract fun taskAssignmentDao(): TaskAssignmentDao

    abstract fun languageDaoExtra(): LanguageDaoExtra
    abstract fun languageResourceDaoExtra(): LanguageResourceDaoExtra
    abstract fun languageResourceValueDaoExtra(): LanguageResourceValueDaoExtra
    abstract fun microtaskAssignmentDaoExtra(): MicrotaskAssignmentDaoExtra
    abstract fun microtaskDaoExtra(): MicrotaskDaoExtra
    abstract fun microtaskGroupAssignmentDaoExtra(): MicrotaskGroupAssignmentDaoExtra
    abstract fun taskDaoExtra(): TaskDaoExtra
    abstract fun workerDaoExtra(): WorkerDaoExtra
    abstract fun karyaFileDao(): KaryaFileDao
    abstract fun workerLanguageSkillDaoExtra(): WorkerLanguageSkillDaoExtra

    companion object {
        private var INSTANCE: KaryaDatabase? = null

        fun getInstance(context: Context): KaryaDatabase? {
            if (INSTANCE == null) {
                synchronized(KaryaDatabase::class) {
                    INSTANCE = Room.databaseBuilder(
                        context.applicationContext,
                        KaryaDatabase::class.java, "karya.db"
                    )
                        .build()
                }
            }
            return INSTANCE
        }
    }
}
