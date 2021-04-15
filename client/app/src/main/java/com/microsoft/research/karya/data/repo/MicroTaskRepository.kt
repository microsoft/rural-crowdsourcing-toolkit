package com.microsoft.research.karya.data.repo

import com.google.gson.JsonArray
import com.microsoft.research.karya.data.model.karya.MicrotaskAssignmentRecord
import com.microsoft.research.karya.data.service.MicroTaskAPI
import kotlinx.coroutines.flow.flow
import okhttp3.MultipartBody
import org.json.JSONArray
import javax.inject.Inject

class MicroTaskRepository @Inject constructor(private val microTaskAPI: MicroTaskAPI) {

    fun getAssignments(accessCode: String, idToken: String, type: String, from: String) = flow {

        if (accessCode.isEmpty() or idToken.isEmpty()) {
            error("Either Access Code or ID Token is required")
        }

        val response = microTaskAPI.getAssignments(idToken, type, from)
        val assignments = response.body()

        if (!response.isSuccessful) {
            error("Failed to get assignments")
        }

        if (assignments != null) {
            emit(assignments)
        } else {
            error("Request failed, response body was null")
        }
    }

    fun submitAssignments(
        idToken: String,
        accessCode: String,
        updates: List<MicrotaskAssignmentRecord>
    ) = flow {
        val response = microTaskAPI.submitAssignments(idToken, updates)
        val successAssignmentIDS = response.body()

        if (!response.isSuccessful) {
            error("Failed to upload file")
        }

        if (successAssignmentIDS != null) {
            emit(successAssignmentIDS)
        } else {
            error("Request failed, response body was null")
        }
    }
}
