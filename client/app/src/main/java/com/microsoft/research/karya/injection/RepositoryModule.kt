package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.local.daos.KaryaFileDao
import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskDaoExtra
import com.microsoft.research.karya.data.local.ng.WorkerDao
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.data.service.LanguageAPI
import com.microsoft.research.karya.data.service.WorkerAPI
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class RepositoryModule {

  @Provides
  @Singleton
  fun provideLanguageRepository(languageAPI: LanguageAPI): LanguageRepository {
    return LanguageRepository(languageAPI)
  }

  @Provides
  @Singleton
  fun provideMicroTaskRepository(
    microTaskDao: MicroTaskDao,
    microtaskDaoExtra: MicrotaskDaoExtra
  ): MicroTaskRepository {
    return MicroTaskRepository(microTaskDao, microtaskDaoExtra)
  }

  @Provides
  @Singleton
  fun provideWorkerRepository(workerAPI: WorkerAPI, workerDao: WorkerDao): WorkerRepository {
    return WorkerRepository(workerAPI, workerDao)
  }

  @Provides
  @Singleton
  fun provideKaryaFileRepository(karyaFileDao: KaryaFileDao): KaryaFileRepository {
    return KaryaFileRepository(karyaFileDao)
  }
}
