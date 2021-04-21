// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.NetworkActivity
import com.microsoft.research.karya.database.models.AuthProviderType
import com.microsoft.research.karya.database.modelsExtra.WorkerObject
import com.microsoft.research.karya.skillSpecification.SkillSpecification
import com.microsoft.research.karya.utils.AppConstants

class RegisterWorker :
    NetworkActivity(indeterminateProgress = true, noMessage = false, allowRetry = true) {

  /** Get all UI strings for the string */
  override suspend fun getStringsForActivity() {
    networkRequestMessage = getValueFromName(R.string.registering_worker)
  }

  override suspend fun executeRequest() {
    /** Generate the worker record to be submitted */
    val worker =
        WorkerObject(
            creation_code = WorkerInformation.creation_code!!,
            auth_provider = AuthProviderType.phone_otp,
            phone_number = WorkerInformation.phone_number!!,
            age = WorkerInformation.age_group!!,
            gender = WorkerInformation.gender!!,
            app_language = WorkerInformation.app_language!!)

    val registerWorkerResponse = karyaAPI.updateWorkerUsingCreationCode(worker)
    if (registerWorkerResponse.isSuccessful) {
      val workerRecord = registerWorkerResponse.body()!!
      karyaDb.workerDao().upsert(workerRecord)
    } else {
      networkErrorMessage =
          getString(
              when (registerWorkerResponse.code()) {
                409 -> R.string.phone_number_already_used
                404 -> R.string.unknown_error
                else -> R.string.unknown_error
              })
      throw Exception()
    }
  }

  /** Call the skill selection activity */
  override fun startNextActivity() {
    val nextIntent = Intent(applicationContext, SkillSpecification::class.java)
    nextIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
    nextIntent.putExtra(AppConstants.LANGUAGE_ID_FOR_SKILLS, WorkerInformation.app_language)
    nextIntent.putExtra(AppConstants.SKILL_SPECIFICATION_CALLER, AppConstants.REGISTER_WORKER)
    startActivity(nextIntent)
  }
}
