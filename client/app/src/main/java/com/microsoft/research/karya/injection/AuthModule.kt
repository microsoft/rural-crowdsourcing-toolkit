package com.microsoft.research.karya.injection

import android.content.Context
import com.microsoft.research.karya.data.manager.NgAuthManager
import com.microsoft.research.karya.data.repo.AuthRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.injection.qualifier.IoDispatcher
import dagger.Module
import dagger.Provides
import dagger.Reusable
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
class AuthModule {

  @Provides
  @Reusable
  @IoDispatcher
  fun providesAndroidIODispatcher(): CoroutineDispatcher {
    return Dispatchers.IO
  }

  @Provides
  @Singleton
  fun providesAuthManager(
    @ApplicationContext context: Context,
    @IoDispatcher dispatcher: CoroutineDispatcher,
    authRepository: AuthRepository,
  ): NgAuthManager {
    return NgAuthManager(context, authRepository, dispatcher)
  }
}
