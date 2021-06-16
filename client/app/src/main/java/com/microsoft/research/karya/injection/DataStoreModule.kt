package com.microsoft.research.karya.injection

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import com.microsoft.research.karya.utils.extensions.dataStore
import dagger.Module
import dagger.Provides
import dagger.Reusable
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent

@Module
@InstallIn(SingletonComponent::class)
class DataStoreModule {

  @Provides
  @Reusable
  fun dataStore(@ApplicationContext context: Context): DataStore<Preferences> {
    return context.dataStore
  }
}
