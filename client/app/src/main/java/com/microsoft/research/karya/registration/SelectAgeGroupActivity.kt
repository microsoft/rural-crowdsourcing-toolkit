// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import android.os.Bundle
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import kotlinx.android.synthetic.main.activity_select_age_group.*

class SelectAgeGroupActivity : BaseActivity(useAssistant = true) {

  private lateinit var ageGroupPromptString: String
  private lateinit var yearsString: String

  override fun onCreate(savedInstanceState: Bundle?) {
    setContentView(R.layout.activity_select_age_group)
    super.onCreate(savedInstanceState)

    youthBtn.setOnClickListener { handleAgeGroupClick("18-25") }
    middleAgeBtn.setOnClickListener { handleAgeGroupClick("26-50") }
    oldAgeBtn.setOnClickListener { handleAgeGroupClick("50+") }

    submitAgeGroupIb.setOnClickListener {
      submitAgeGroupIb.visibility = View.INVISIBLE
      submitAgeGroup()
    }

    disableAgeGroupSubmitButton()
  }

  override suspend fun getStringsForActivity() {
    ageGroupPromptString = getValueFromName(R.string.age_prompt)
    yearsString = getValueFromName(R.string.years)
  }

  override suspend fun setInitialUIStrings() {
    val youthLabel = "18-25 $yearsString"
    val middleLabel = "26-50 $yearsString"
    val oldLabel = "50+ $yearsString"
    ageGroupPromptTv.text = ageGroupPromptString
    youthBtn.text = youthLabel
    middleAgeBtn.text = middleLabel
    oldAgeBtn.text = oldLabel
  }

  /** On assistant click, play the age group prompt */
  override fun onAssistantClick() {
    super.onAssistantClick()
    playAssistantAudio(R.string.audio_age_prompt)
  }

  /** Handle choice of age group */
  private fun handleAgeGroupClick(ageGroup: String) {
    WorkerInformation.age_group = ageGroup
    youthBtn.isSelected = false
    middleAgeBtn.isSelected = false
    oldAgeBtn.isSelected = false
    when (ageGroup) {
      "18-25" -> {
        youthBtn.isSelected = true
      }
      "26-50" -> {
        middleAgeBtn.isSelected = true
      }
      "50+" -> {
        oldAgeBtn.isSelected = true
      }
    }
    enableAgeGroupSubmitButton()
  }

  /** Disable age group submit button */
  private fun disableAgeGroupSubmitButton() {
    submitAgeGroupIb.isClickable = false
    submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_disabled)
  }

  /** Enable age group submit button */
  private fun enableAgeGroupSubmitButton() {
    submitAgeGroupIb.isClickable = true
    submitAgeGroupIb.setBackgroundResource(R.drawable.ic_next_enabled)
  }

  /**
   * Submit age group. This is the last step in the registration. After the user submits this
   * request, move to the register worker activity.
   */
  private fun submitAgeGroup() {
    startActivity(Intent(applicationContext, RegisterWorker::class.java))
  }
}
