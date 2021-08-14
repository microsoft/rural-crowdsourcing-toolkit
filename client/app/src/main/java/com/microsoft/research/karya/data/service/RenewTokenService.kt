package com.microsoft.research.karya.data.service

import com.microsoft.research.karya.data.model.karya.ng.WorkerRecord
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header

interface RenewTokenService {
    /*
   * This API would be used to renew the token
   * */
    @GET("/renew_id_token")
    suspend fun getWorkerUsingAccessCode(
        @Header("karya-id-token") idToken: String,
    ): Response<String>
}
