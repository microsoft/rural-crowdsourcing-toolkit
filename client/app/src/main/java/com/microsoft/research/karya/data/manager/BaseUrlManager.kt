package com.microsoft.research.karya.data.manager

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext

class BaseUrlManager(val applicationContext: Context) {

  private lateinit var baseUrl:String

  suspend fun updateBaseUrl(url: String) {
    check(url.isNotEmpty()) { "URL cannot be null" }
    baseUrl = url
    setUpdatedBaseUrl(url)
  }

  private suspend fun setUpdatedBaseUrl(url: String) = withContext(Dispatchers.IO) {
    val baseUrlKey = stringPreferencesKey(PreferenceKeys.BASE_URL)
    applicationContext.dataStore.edit { prefs -> prefs[baseUrlKey] = url }
  }

  suspend fun getBaseUrl(): String {
    if (!this::baseUrl.isInitialized) {
      val baseUrlKey = stringPreferencesKey(PreferenceKeys.BASE_URL)
      val data = applicationContext.dataStore.data.first()
      baseUrl = data[baseUrlKey] ?: throw Exception("No URL Found")
    }
    return baseUrl
  }

}