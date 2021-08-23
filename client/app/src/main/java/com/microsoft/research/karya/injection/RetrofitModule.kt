package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.manager.NgAuthManager
import com.microsoft.research.karya.data.remote.interceptors.IdTokenRenewInterceptor
import com.microsoft.research.karya.data.remote.interceptors.VersionInterceptor
import com.microsoft.research.karya.data.repo.AuthRepository
import com.microsoft.research.karya.data.service.KaryaFileAPI
import com.microsoft.research.karya.data.service.LanguageAPI
import com.microsoft.research.karya.data.service.MicroTaskAssignmentAPI
import com.microsoft.research.karya.data.service.WorkerAPI
import com.microsoft.research.karya.injection.qualifier.BaseUrl
import com.microsoft.research.karya.injection.qualifier.KaryaOkHttpClient
import dagger.Module
import dagger.Provides
import dagger.Reusable
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

@Module
@InstallIn(SingletonComponent::class)
class RetrofitModule {

  @Provides
  @Reusable
  fun provideGsonConverterFactory(): GsonConverterFactory {
    return GsonConverterFactory.create()
  }

  @Provides
  @Reusable
  @BaseUrl
  fun provideBaseUrl(): String {
    return "https://karyaboxtest.eastus.cloudapp.azure.com"
  }

  @Provides
  @Reusable
  fun provideLoggingInterceptor(): HttpLoggingInterceptor {
    return HttpLoggingInterceptor()
      .setLevel(HttpLoggingInterceptor.Level.BODY)
  }

  @Provides
  @Reusable
  fun provideIdTokenRenewInterceptor(
    authRepository: AuthRepository,
    authManager: NgAuthManager,
    @BaseUrl baseUrl: String
  ): IdTokenRenewInterceptor {
    return IdTokenRenewInterceptor(authRepository, authManager, baseUrl)
  }

  @Provides
  @Reusable
  fun provideVersionInterceptor(): VersionInterceptor {
    return VersionInterceptor()
  }

  @KaryaOkHttpClient
  @Provides
  @Reusable
  fun provideOkHttp(
    idTokenRenewInterceptor: IdTokenRenewInterceptor,
    versionInterceptor: VersionInterceptor
  ): OkHttpClient {
    return OkHttpClient.Builder()
      .connectTimeout(10, TimeUnit.MINUTES)
      .readTimeout(10, TimeUnit.MINUTES)
      .addInterceptor(idTokenRenewInterceptor)
      .addInterceptor(versionInterceptor)
      .build()
  }

  @Provides
  @Reusable
  fun provideRetrofitInstance(
    @BaseUrl baseUrl: String,
    converterFactory: GsonConverterFactory,
    @KaryaOkHttpClient okHttpClient: OkHttpClient
  ): Retrofit {
    return Retrofit.Builder().client(okHttpClient).baseUrl(baseUrl)
      .addConverterFactory(converterFactory).build()
  }

  @Provides
  @Reusable
  fun provideLanguageAPI(retrofit: Retrofit): LanguageAPI {
    return retrofit.create(LanguageAPI::class.java)
  }

  @Provides
  @Reusable
  fun provideMicroTaskAPI(retrofit: Retrofit): MicroTaskAssignmentAPI {
    return retrofit.create(MicroTaskAssignmentAPI::class.java)
  }

  @Provides
  @Reusable
  fun provideWorkerAPI(retrofit: Retrofit): WorkerAPI {
    return retrofit.create(WorkerAPI::class.java)
  }

  @Provides
  @Reusable
  fun provideKaryaFileAPIService(retrofit: Retrofit): KaryaFileAPI {
    return retrofit.create(KaryaFileAPI::class.java)
  }
}
