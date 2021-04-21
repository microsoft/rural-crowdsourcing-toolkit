// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** This activity allows the user to self-specify the skills they have in a particular language. */
package com.microsoft.research.karya.skillSpecification

import android.content.Intent
import android.os.Bundle
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import com.microsoft.research.karya.utils.AppConstants
import kotlinx.android.synthetic.main.activity_skill_specification.*

class SkillSpecification : BaseActivity(useAssistant = true) {

  private lateinit var skillQuestionDescription: String
  private lateinit var readQuestion: String
  private lateinit var speakQuestion: String
  private lateinit var typeQuestion: String

  private var languageId: Int = 0
  private var canRead: Boolean? = null
  private var canSpeak: Boolean? = null
  private var canType: Boolean? = null
  private var newSkill = true

  /**
   * On create, extract the language in which to obtain the skills, fetch the relevant values and
   * update the UI.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    setContentView(R.layout.activity_skill_specification)
    super.onCreate(savedInstanceState)

    /** Extract the language Id and source for this activity */
    languageId = intent.getIntExtra(AppConstants.LANGUAGE_ID_FOR_SKILLS, 0)
    if (languageId == 0) {
      throw Exception("Undefined language")
    }

    /** Set the click listeners */
    readYesIb.setOnClickListener { readClick(true) }
    readNoIb.setOnClickListener { readClick(false) }
    speakYesIb.setOnClickListener { speakClick(true) }
    speakNoIb.setOnClickListener { speakClick(false) }
    typeYesIb.setOnClickListener { typeClick(true) }
    typeNoIb.setOnClickListener { typeClick(false) }

    /** Set back/next listeners */
    skillSpecBackIb.setOnClickListener {
      skillSpecNextIb.visibility = View.INVISIBLE
      skillSpecBackIb.visibility = View.INVISIBLE
      onBackClick()
    }
    skillSpecNextIb.setOnClickListener {
      skillSpecNextIb.visibility = View.INVISIBLE
      skillSpecBackIb.visibility = View.INVISIBLE
      onSubmit()
    }
  }

  /** Get strings for the UI activity */
  override suspend fun getStringsForActivity() {
    /** Fetch question descriptions */
    skillQuestionDescription = getValueFromName(R.string.skill_question_description, languageId)
    readQuestion = getValueFromName(R.string.read_skill_question, languageId)
    speakQuestion = getValueFromName(R.string.speak_skill_question, languageId)
    typeQuestion = getValueFromName(R.string.type_skill_question, languageId)
    skillQuestionDescription =
        skillQuestionDescription.replace("<tick>", "(?)").replace("<cross>", "(?)")

    /** Check if the database has a current record */
    val skillRecord = karyaDb.workerLanguageSkillDaoExtra().getSkillsForLanguage(languageId)
    newSkill = skillRecord == null
    canRead = skillRecord?.can_read
    canSpeak = skillRecord?.can_speak
    canType = skillRecord?.can_type
  }

  /** Set initial UI strings */
  override suspend fun setInitialUIStrings() {
    skillQuestionDescriptionTv.text = skillQuestionDescription
    readQuestionTv.text = readQuestion
    speakQuestionTv.text = speakQuestion
    typeQuestionTv.text = typeQuestion

    /** If new skill, then ask one question at a time */
    if (!newSkill) {
      if (canRead!!) readClick(true) else readClick(false)
      if (canSpeak!!) speakClick(true) else speakClick(false)
      if (canType!!) typeClick(true) else typeClick(false)
    } else {
      speakQuestionCl.visibility = View.INVISIBLE
      typeQuestionCl.visibility = View.INVISIBLE
    }
    updateSubmitButtonState()

    /** If new skill for app language, then there is no going back */
    if (newSkill && languageId == appLanguageId) {
      skillSpecBackIb.visibility = View.INVISIBLE
    }
  }

  /**
   * On assistant click, if new skill, play the audio for skill question description play the read
   * skill question.
   */
  override fun onAssistantClick() {
    super.onAssistantClick()
    if (newSkill) {
      playAssistantAudio(
          R.string.audio_skill_question_description,
          languageId,
          onCompletionListener = { playReadQuestion() })
    }
  }

  private fun playReadQuestion() {
    if (canRead == null) playAssistantAudio(R.string.audio_read_skill_question, languageId)
  }

  /** Click handlers for the six skill buttons */
  private fun readClick(state: Boolean) {
    canRead = state
    val yesBackground = if (state) R.drawable.ic_tick_on else R.drawable.ic_tick_off
    val noBackground = if (state) R.drawable.ic_cross_off else R.drawable.ic_cross_on
    readYesIb.setBackgroundResource(yesBackground)
    readNoIb.setBackgroundResource(noBackground)
    speakQuestionCl.visibility = View.VISIBLE
    if (canSpeak == null) playAssistantAudio(R.string.audio_speak_skill_question, languageId)
    updateSubmitButtonState()
  }

  private fun speakClick(state: Boolean) {
    canSpeak = state
    val yesBackground = if (state) R.drawable.ic_tick_on else R.drawable.ic_tick_off
    val noBackground = if (state) R.drawable.ic_cross_off else R.drawable.ic_cross_on
    speakYesIb.setBackgroundResource(yesBackground)
    speakNoIb.setBackgroundResource(noBackground)
    typeQuestionCl.visibility = View.VISIBLE
    if (canType == null) playAssistantAudio(R.string.audio_type_skill_question, languageId)
    updateSubmitButtonState()
  }

  private fun typeClick(state: Boolean) {
    canType = state
    val yesBackground = if (state) R.drawable.ic_tick_on else R.drawable.ic_tick_off
    val noBackground = if (state) R.drawable.ic_cross_off else R.drawable.ic_cross_on
    typeYesIb.setBackgroundResource(yesBackground)
    typeNoIb.setBackgroundResource(noBackground)
    updateSubmitButtonState()
  }

  /** Update submit button state */
  private fun updateSubmitButtonState() {
    if (canRead != null &&
        canSpeak != null &&
        canType != null &&
        (canRead == true || canSpeak == true || canType == true)) {
      skillSpecNextIb.isClickable = true
      skillSpecNextIb.setBackgroundResource(R.drawable.ic_next_enabled)
    } else {
      skillSpecNextIb.isClickable = false
      skillSpecNextIb.setBackgroundResource(R.drawable.ic_next_disabled)
    }
  }

  /**
   * On back click handler. Back click is available only when this activity is invoked from the
   * skill language selection screen. So, there is nothing to be done when back is clicked.
   */
  private fun onBackClick() {
    finish()
  }

  /**
   * On submit handler. When the submit (next) button is clicked, pass on the language skill
   * information to the register activity.
   */
  private fun onSubmit() {
    val fromActivity = intent.getIntExtra(AppConstants.SKILL_SPECIFICATION_CALLER, 0)
    val nextIntent = Intent(applicationContext, RegisterSkill::class.java)
    nextIntent.putExtra(AppConstants.SKILL_SPECIFICATION_CALLER, fromActivity)
    nextIntent.putExtra(AppConstants.LANGUAGE_ID_FOR_SKILLS, languageId)
    nextIntent.putExtra(AppConstants.CAN_READ, canRead)
    nextIntent.putExtra(AppConstants.CAN_SPEAK, canSpeak)
    nextIntent.putExtra(AppConstants.CAN_TYPE, canType)
    startActivity(nextIntent)
    finish()
  }
}
