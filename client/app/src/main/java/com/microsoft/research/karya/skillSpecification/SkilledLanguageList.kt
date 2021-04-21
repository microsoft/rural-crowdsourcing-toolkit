// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This activity displays the list of languages in the platform, marking the languages in which the
 * user already has specified skills.
 */
package com.microsoft.research.karya.skillSpecification

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.common.BaseActivity
import com.microsoft.research.karya.dashboard.DashboardActivity
import com.microsoft.research.karya.utils.AppConstants
import kotlinx.android.synthetic.main.activity_skilled_language_list.*
import kotlinx.android.synthetic.main.item_skilled_language.view.*
import kotlinx.coroutines.launch

class SkilledLanguageList : BaseActivity(useAssistant = true), SkilledLanguageClickListener {

  /** Adapter for skilled language list */
  private lateinit var skilledLanguageListAdapter: SkilledLanguageListAdapter
  private lateinit var selectLanguagePrompt: String

  override fun onCreate(savedInstanceState: Bundle?) {
    setContentView(R.layout.activity_skilled_language_list)
    super.onCreate(savedInstanceState)

    /** Set the adapter for skilled languages */
    skilledLanguageListAdapter = SkilledLanguageListAdapter(this, this)
    skilledLanguagesRv.adapter = skilledLanguageListAdapter

    /** Set the listener for the next button */
    nextIb.setOnClickListener { onNextClick() }
  }

  /** Get strings for this activity */
  override suspend fun getStringsForActivity() {
    selectLanguagePrompt = getValueFromName(R.string.other_language_selection)
  }

  /** Set main UI strings for the activity */
  override suspend fun setInitialUIStrings() {
    selectLanguagePromptTv.text = selectLanguagePrompt
  }

  /** On assistant click, play the audio for other language selection */
  override fun onAssistantClick() {
    super.onAssistantClick()
    playAssistantAudio(R.string.audio_other_language_selection)
  }

  /** On resume, update the list of skilled languages */
  override fun onResume() {
    super.onResume()
    updateSkilledLanguages()
  }

  /** Update list of skilled languages */
  private fun updateSkilledLanguages() {
    ioScope.launch {
      val languageRecords = karyaDb.languageDaoExtra().getListSupported()

      var skillSupportedLanguages = languageRecords

      val currentSkills = karyaDb.workerLanguageSkillDao().getAll()
      val skilledLanguages: List<SkilledLanguage> =
          skillSupportedLanguages.map { language ->
            val skill = currentSkills.find { it.language_id == language.id }
            SkilledLanguage(
                language.id,
                language.primary_language_name,
                skill != null,
                skill?.can_read ?: false,
                skill?.can_speak ?: false,
                skill?.can_type ?: false)
          }
      uiScope.launch { skilledLanguageListAdapter.setList(skilledLanguages) }
    }
  }

  /**
   * When a language is selected, move to the skill specification activity for the selected language
   */
  override fun onLanguageSelected(language: SkilledLanguage) {
    val nextIntent = Intent(applicationContext, SkillSpecification::class.java)
    nextIntent.putExtra(AppConstants.LANGUAGE_ID_FOR_SKILLS, language.id)
    nextIntent.putExtra(AppConstants.SKILL_SPECIFICATION_CALLER, AppConstants.SKILLED_LANGUAGE_LIST)
    startActivity(nextIntent)
  }

  /** Next click handler */
  private fun onNextClick() {
    /** Set from activity */
    val fromActivity = intent.getIntExtra(AppConstants.SKILLED_LANGUAGE_LIST_CALLER, 0)

    when (fromActivity) {
      AppConstants.DASHBOARD -> {
        finish()
      }
      AppConstants.REGISTER_SKILL -> {
        val nextIntent = Intent(applicationContext, DashboardActivity::class.java)
        nextIntent.putExtra(AppConstants.DASHBOARD_CALLER, AppConstants.SKILLED_LANGUAGE_LIST)
        startActivity(nextIntent)
        finish()
      }
    }
  }
}

/** Adapter for skilled language list */
class SkilledLanguageListAdapter(
    val context: Context,
    private val languageClickListener: SkilledLanguageClickListener
) : RecyclerView.Adapter<SkilledLanguageViewHolder>() {

  /** Current list of skilled languages */
  private var languages: List<SkilledLanguage> = arrayListOf()

  /** When new view holder is created */
  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SkilledLanguageViewHolder {
    return SkilledLanguageViewHolder(
        LayoutInflater.from(context).inflate(R.layout.item_skilled_language, parent, false))
  }

  override fun getItemCount(): Int {
    return languages.size
  }

  override fun onBindViewHolder(holder: SkilledLanguageViewHolder, position: Int) {
    val language = languages[position]
    holder.nameTv.text = language.name
    holder.canReadIv.visibility = if (language.canRead) View.VISIBLE else View.INVISIBLE
    holder.canSpeakIv.visibility = if (language.canSpeak) View.VISIBLE else View.INVISIBLE
    holder.canTypeIv.visibility = if (language.canType) View.VISIBLE else View.INVISIBLE
    holder.languageCv.setOnClickListener {
      languageClickListener.onLanguageSelected(language)
      notifyDataSetChanged()
    }
  }

  /** Reset the list of languages */
  fun setList(languages_: List<SkilledLanguage>) {
    languages = languages_
    notifyDataSetChanged()
  }
}

/** Skilled language view holder */
class SkilledLanguageViewHolder(iv: View) : RecyclerView.ViewHolder(iv) {
  val languageCv: CardView = iv.languageCv
  val nameTv: TextView = iv.languageName
  val canReadIv: ImageView = iv.canReadIv
  val canSpeakIv: ImageView = iv.canSpeakIv
  val canTypeIv: ImageView = iv.canTypeIv
}

/** Skilled language data class */
data class SkilledLanguage(
    var id: Int,
    var name: String,
    var registered: Boolean,
    var canRead: Boolean,
    var canSpeak: Boolean,
    var canType: Boolean
)

/** Click listener for skilled language */
interface SkilledLanguageClickListener {
  fun onLanguageSelected(language: SkilledLanguage)
}
