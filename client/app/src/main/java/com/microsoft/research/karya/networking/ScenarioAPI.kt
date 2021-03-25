package com.microsoft.research.karya.networking

import com.microsoft.research.karya.database.models.ScenarioRecord
import retrofit2.Response
import retrofit2.http.GET

interface ScenarioAPI {

    @GET("/scenario")
    suspend fun getScenarios(): Response<List<ScenarioRecord>>
}
