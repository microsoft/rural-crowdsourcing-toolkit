package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.local.daos.WorkerDao
import com.microsoft.research.karya.data.repo.KaryaFileRepository
import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.data.service.KaryaFileAPI
import com.microsoft.research.karya.data.service.LanguageAPI
import com.microsoft.research.karya.data.service.MicroTaskAPI
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
  fun provideMicroTaskRepository(microTaskAPI: MicroTaskAPI): MicroTaskRepository {
    return MicroTaskRepository(microTaskAPI)
  }

  @Provides
  @Singleton
  fun provideWorkerRepository(workerAPI: WorkerAPI, workerDao: WorkerDao): WorkerRepository {
    return WorkerRepository(workerAPI, workerDao)
  }

  @Provides
  @Singleton
  fun provideKaryaFileRepository(karyaFileAPI: KaryaFileAPI): KaryaFileRepository {
    return KaryaFileRepository(karyaFileAPI)
  }
}
