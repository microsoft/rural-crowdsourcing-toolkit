// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.skillSpecification

import android.content.Intent
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.NetworkActivity
import com.microsoft.research.karya.data.model.karya.WorkerLanguageSkillRecord
import com.microsoft.research.karya.data.model.karya.modelsExtra.WorkerLanguageSkillObject
import com.microsoft.research.karya.utils.AppConstants

class RegisterSkill : NetworkActivity(
    indeterminateProgress = true,
    noMessage = false,
    allowRetry = true,
    needIdToken = true
) {

    /** Local state */
    private var currentSkill: WorkerLanguageSkillRecord? = null
    private var moveToSkillLanguageList: Boolean = false
    private var languageId: Int = 0
    private var canRead: Boolean = false
    private var canSpeak: Boolean = false
    private var canType: Boolean = false
    private var newSkill = true

    /** Fetch message strings */
    override suspend fun getStringsForActivity() {
        languageId = intent.getIntExtra(AppConstants.LANGUAGE_ID_FOR_SKILLS, 0)
        canRead = intent.getBooleanExtra(AppConstants.CAN_READ, false)
        canSpeak = intent.getBooleanExtra(AppConstants.CAN_SPEAK, false)
        canType = intent.getBooleanExtra(AppConstants.CAN_TYPE, false)

        currentSkill =
            karyaDb.workerLanguageSkillDao().getAll().find { it.language_id == languageId }
        newSkill = currentSkill == null

        networkRequestMessage = if (newSkill) getValueFromName(R.string.registering_skill) else ""
    }

    /**
     * If request is for a new skill, then explicit registration with the box is required. If the
     * request is to update an existing skill, then we need to just update the local database.
     */
    override suspend fun executeRequest() {
        val one = 1.0.toFloat()
        val zero = 0.0.toFloat()

        val skillCall = if (newSkill) {
            // Register the new skill with the box
            val skillObject = WorkerLanguageSkillObject(
                worker_id = thisWorker.id,
                language_id = languageId,
                can_read = canRead,
                can_speak = canSpeak,
                can_type = canType,
                read_score = if (canRead) one else zero,
                speak_score = if (canSpeak) one else zero,
                type_score = if (canType) one else zero
            )

            /** Send request to register skill */
            karyaAPI.registerSkill(
                skillObject,
                thisWorker.auth_provider.toString(),
                thisWorker.id_token!!
            )
        } else {
            val skillObject = WorkerLanguageSkillObject(
                language_id = currentSkill!!.language_id,
                worker_id = currentSkill!!.worker_id,
                can_read = canRead,
                can_type = canType,
                can_speak = canSpeak,
                read_score = currentSkill!!.read_score!!,
                speak_score = currentSkill!!.speak_score!!,
                type_score = currentSkill!!.type_score!!
            )

            karyaAPI.updateSkill(
                skillObject,
                thisWorker.auth_provider.toString(),
                thisWorker.id_token!!,
                currentSkill!!.id
            )
        }

        val skillResponse = skillCall.execute()

        if (skillResponse.isSuccessful) {
            val skillRecord = skillResponse.body()!!
            karyaDb.workerLanguageSkillDao().upsert(skillRecord)
        } else {
            networkErrorMessage = getString(R.string.failed_to_register_skill)
            throw Exception()
        }
    }

    /**
     * Based on the [moveToSkillLanguageList] flag, move to skill language list activity or finish.
     */
    override fun startNextActivity() {
        when (intent.getIntExtra(AppConstants.SKILL_SPECIFICATION_CALLER, 0)) {
            AppConstants.FETCH_FILE_FOR_APP_LANGUAGE,
            AppConstants.SKILLED_LANGUAGE_LIST -> {
                finish()
            }
            AppConstants.SPLASH_SCREEN,
            AppConstants.REGISTER_WORKER -> {
                val nextIntent = Intent(applicationContext, SkilledLanguageList::class.java)
                nextIntent.putExtra(
                    AppConstants.SKILLED_LANGUAGE_LIST_CALLER,
                    AppConstants.REGISTER_SKILL
                )
                startActivity(nextIntent)
            }
            else -> {
                throw Exception("Unknown skill specification caller caller")
            }
        }
    }
}
