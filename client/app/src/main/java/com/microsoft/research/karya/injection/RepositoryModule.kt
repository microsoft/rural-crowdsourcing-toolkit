package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.local.daos.*
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskDaoExtra
import com.microsoft.research.karya.data.repo.*
import com.microsoft.research.karya.data.service.LanguageAPI
import com.microsoft.research.karya.data.service.PaymentAPI
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
  fun provideWorkerRepository(workerAPI: WorkerAPI, workerDao: WorkerDao, leaderboardDao: LeaderboardDao): WorkerRepository {
    return WorkerRepository(workerAPI, workerDao, leaderboardDao)
  }

  @Provides
  @Singleton
  fun provideKaryaFileRepository(karyaFileDao: KaryaFileDao): KaryaFileRepository {
    return KaryaFileRepository(karyaFileDao)
  }

  @Provides
  @Singleton
  fun provideAuthRepository(workerDao: WorkerDao): AuthRepository {
    return AuthRepository(workerDao)
  }

  @Provides
  @Singleton
  fun providesPaymentRepository(paymentAPI: PaymentAPI, paymentAccountDao: PaymentAccountDao): PaymentRepository {
    return PaymentRepository(paymentAPI, paymentAccountDao)
  }
}
