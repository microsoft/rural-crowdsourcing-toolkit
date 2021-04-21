// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.registration

import android.content.Intent
import android.os.Bundle
import android.view.View
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import kotlinx.android.synthetic.main.activity_select_gender.*

class SelectGenderActivity : BaseActivity(useAssistant = true) {

  private lateinit var genderPromptMessage: String
  private lateinit var maleLabel: String
  private lateinit var femaleLabel: String

  override fun onCreate(savedInstanceState: Bundle?) {
    setContentView(R.layout.activity_select_gender)
    super.onCreate(savedInstanceState)

    WorkerInformation.gender = "not_specified"

    maleBtn.setOnClickListener {
      WorkerInformation.gender = "male"
      maleBtn.isSelected = true
      femaleBtn.isSelected = false
    }

    femaleBtn.setOnClickListener {
      WorkerInformation.gender = "female"
      femaleBtn.isSelected = true
      maleBtn.isSelected = false
    }

    submitGenderIb.setOnClickListener {
      submitGenderIb.visibility = View.INVISIBLE
      startActivity(Intent(applicationContext, SelectAgeGroupActivity::class.java))
    }
  }

  /** Get all strings for this activity */
  override suspend fun getStringsForActivity() {
    genderPromptMessage = getValueFromName(R.string.gender_prompt)
    maleLabel = getValueFromName(R.string.male)
    femaleLabel = getValueFromName(R.string.female)
  }

  override suspend fun setInitialUIStrings() {
    selectGenderPromptTv.text = genderPromptMessage
    maleTv.text = maleLabel
    femaleTv.text = femaleLabel
  }

  /** On assistant click, play the gender prompt */
  override fun onAssistantClick() {
    super.onAssistantClick()
    playAssistantAudio(R.string.audio_gender_prompt)
  }
}
