package com.microsoft.research.karya.repo

import com.microsoft.research.karya.networking.ScenarioAPI
import kotlinx.coroutines.flow.flow

class ScenarioRepository(private val scenarioAPI: ScenarioAPI) {

    fun getScenarios() = flow {
        val response = scenarioAPI.getScenarios()
        val scenarios = response.body()

        if (!response.isSuccessful) {
            error("Request failed, response code: ${response.code()}")
        }

        if (scenarios != null) {
            emit(scenarios)
        } else {
            error("Request failed, response body was null")
        }
    }
}