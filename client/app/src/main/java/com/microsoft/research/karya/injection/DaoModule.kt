package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.local.daos.LanguageDao
import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.manager.KaryaDatabase
import dagger.Module
import dagger.Provides
import dagger.Reusable
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
class DaoModule {

  @Provides
  @Reusable
  fun provideWorkerDao(karyaDatabase: KaryaDatabase): WorkerDao {
    return karyaDatabase.workerDao()
  }

  @Provides
  @Reusable
  fun provideLanguageDao(karyaDatabase: KaryaDatabase): LanguageDao {
    return karyaDatabase.languageDao()
  }
}
