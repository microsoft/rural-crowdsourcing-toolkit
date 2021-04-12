package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.repo.LanguageRepository
import com.microsoft.research.karya.data.repo.MicroTaskRepository
import com.microsoft.research.karya.data.repo.WorkerRepository
import com.microsoft.research.karya.data.service.KaryaFileAPI
import com.microsoft.research.karya.data.service.LanguageAPI
import com.microsoft.research.karya.data.service.MicroTaskAPI
import com.microsoft.research.karya.data.service.WorkersAPI
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
    fun provideWorkerRepository(workersAPI: WorkersAPI): WorkerRepository {
        return WorkerRepository(workersAPI)
    }

    @Provides
    @Singleton
    fun KaryaFileRepository(karyaFileAPI: KaryaFileAPI): WorkerRepository {
        return KaryaFileRepository(karyaFileAPI)
    }
}
