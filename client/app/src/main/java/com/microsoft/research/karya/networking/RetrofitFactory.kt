// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.networking

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitFactory {
  private val SERVER_URL = "http://192.168.0.105:4040"

  fun create(): KaryaAPIService {
    val retrofit =
        Retrofit.Builder()
            .addConverterFactory(GsonConverterFactory.create())
            .baseUrl(SERVER_URL)
            .build()
    return retrofit.create(KaryaAPIService::class.java)
  }
}
