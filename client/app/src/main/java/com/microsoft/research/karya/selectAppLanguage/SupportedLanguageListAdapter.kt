// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Adapter to display list of supported languages in the recycler view */
package com.microsoft.research.karya.selectAppLanguage

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import kotlinx.android.synthetic.main.item_supported_language.view.*

class SupportedLanguageListAdapter(
    val context: Context,
    private val languageClickListener: SupportedLanguageClickListener
) : RecyclerView.Adapter<SupportedLanguageViewHolder>() {

  /** List of supported languages */
  private var languages: List<SupportedLanguage> = arrayListOf()

  override fun onCreateViewHolder(p0: ViewGroup, p1: Int): SupportedLanguageViewHolder {
    return SupportedLanguageViewHolder(
        LayoutInflater.from(context).inflate(R.layout.item_supported_language, p0, false))
  }

  override fun getItemCount(): Int {
    return languages.size
  }

  override fun onBindViewHolder(p0: SupportedLanguageViewHolder, p1: Int) {
    val supportedLanguage = languages[p1]
    p0.languageName.text = supportedLanguage.name
    p0.languagePrompt.text = supportedLanguage.prompt
    p0.promptPointerIv.visibility =
        if (supportedLanguage.showPointer) View.VISIBLE else View.INVISIBLE
    p0.languageCv.setOnClickListener {
      languageClickListener.onLanguageSelected(supportedLanguage)
      notifyDataSetChanged()
    }
  }

  fun setList(langs: List<SupportedLanguage>) {
    languages = langs
    notifyDataSetChanged()
  }
}

/** Holder for a supported language item */
class SupportedLanguageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
  val languageCv: CardView = itemView.languageCv
  val languageName: TextView = itemView.languageName
  val languagePrompt: TextView = itemView.languagePrompt
  val promptPointerIv: ImageView = itemView.promptPointerIv
}

/** Click listener for supported languages */
interface SupportedLanguageClickListener {
  fun onLanguageSelected(language: SupportedLanguage)
}
