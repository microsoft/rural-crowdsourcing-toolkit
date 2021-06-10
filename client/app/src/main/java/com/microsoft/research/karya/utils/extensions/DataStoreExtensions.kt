package com.microsoft.research.karya.utils.extensions

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

suspend fun DataStore<Preferences>.doOnlyOnce(key: String, action: () -> Unit) {
  val taskCompletedPrefKey = booleanPreferencesKey(key)

  edit { prefs ->
    val isTaskCompleted = prefs[taskCompletedPrefKey] ?: false
    if (isTaskCompleted) return@edit

    action()

    prefs[taskCompletedPrefKey] = true
  }
}
