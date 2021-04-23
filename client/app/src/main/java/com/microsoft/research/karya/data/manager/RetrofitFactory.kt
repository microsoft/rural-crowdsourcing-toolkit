// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.manager

import com.microsoft.research.karya.data.service.KaryaAPIService
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitFactory {
  private val SERVER_URL = "https://karyabox2.eastus.cloudapp.azure.com"

  fun create(): KaryaAPIService {
    val retrofit =
        Retrofit.Builder()
            .addConverterFactory(GsonConverterFactory.create())
            .baseUrl(SERVER_URL)
            .build()
    return retrofit.create(KaryaAPIService::class.java)
  }
}
