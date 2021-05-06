package com.microsoft.research.karya.injection

import com.microsoft.research.karya.data.local.daos.MicroTaskAssignmentDao
import com.microsoft.research.karya.data.local.daos.MicroTaskDao
import com.microsoft.research.karya.data.local.daos.TaskDao
import com.microsoft.research.karya.data.local.daosExtra.MicrotaskAssignmentDaoExtra
import com.microsoft.research.karya.data.local.ng.WorkerDao
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
  fun provideTaskDao(karyaDatabase: KaryaDatabase): TaskDao {
    return karyaDatabase.taskDao()
  }

  @Provides
  @Reusable
  fun provideMicroTaskDao(karyaDatabase: KaryaDatabase): MicroTaskDao {
    return karyaDatabase.microTaskDao()
  }

  @Provides
  @Reusable
  fun provideMicroTaskAssignmentDao(karyaDatabase: KaryaDatabase): MicroTaskAssignmentDao {
    return karyaDatabase.microtaskAssignmentDao()
  }

  @Provides
  @Reusable
  fun provideMicroTaskAssignmentDaoExtra(karyaDatabase: KaryaDatabase): MicrotaskAssignmentDaoExtra {
    return karyaDatabase.microtaskAssignmentDaoExtra()
  }
}
