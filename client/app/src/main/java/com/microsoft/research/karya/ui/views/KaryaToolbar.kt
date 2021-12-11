// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.views

import android.app.AlertDialog
import android.content.Context
import android.graphics.Bitmap
import android.util.AttributeSet
import android.widget.Button
import androidx.appcompat.widget.Toolbar
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.LanguageType
import com.microsoft.research.karya.databinding.AppToolbarBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.visible

class KaryaToolbar : Toolbar {

  constructor(context: Context) : this(context, null)
  constructor(context: Context, attrs: AttributeSet?) : this(context, attrs, 0)
  constructor(context: Context, attrs: AttributeSet?, defStyleAttr: Int) : super(
    context,
    attrs,
    defStyleAttr
  ) {
    initAttributes(context, attrs, defStyleAttr)
  }

  private lateinit var binding: AppToolbarBinding
  private var hideLanguage: Boolean = false
  private var titleText: String = ""
  private lateinit var languageUpdater: (l: LanguageType) -> Unit

  init {
    initView(context)
  }

  private fun initAttributes(context: Context, attrs: AttributeSet?, defStyleAttr: Int) {
    val attributes =
      context.theme.obtainStyledAttributes(attrs, R.styleable.KaryaToolbar, defStyleAttr, 0)
    hideLanguage = attributes.getBoolean(R.styleable.KaryaToolbar_hideLanguage, false)
    titleText = attributes.getString(R.styleable.KaryaToolbar_titleText) ?: ""
  }

  private fun initView(context: Context) {
    val view = inflate(context, R.layout.app_toolbar, this)
    binding = AppToolbarBinding.bind(view)

    binding.languageName.setOnClickListener {
      showUpdateLanguageDialog(context)
    }
  }

  override fun onFinishInflate() {
    super.onFinishInflate()

    if (hideLanguage) {
      binding.languageName.gone()
      binding.assistantCv.gone()
    }

    if (titleText.isNotEmpty()) {
      setTitle(titleText)
    }
  }

  fun setTitle(title: String) {
    binding.title.apply {
      text = title
      visible()
    }
  }

  fun showProfilePicture() {
    binding.profilePictureIv.visible()
  }

  fun setProfilePicture(profilePicture: Bitmap) {
    binding.profilePictureIv.apply {
      setImageBitmap(profilePicture)
      visible()
    }
  }

  fun setProfileClickListener(onClick: () -> Unit) {
    binding.profilePictureIv.apply {
      visible()
      setOnClickListener { onClick() }
    }
  }

  fun setAssistantClickListener(onClick: () -> Unit) {
    binding.assistantCv.apply {
      visible()
      setOnClickListener { onClick() }
    }
  }

  private fun showUpdateLanguageDialog(context: Context) {
    val languageDialog = inflate(context, R.layout.dialog_update_language, null)
    val dialogBuilder = AlertDialog.Builder(context)
    dialogBuilder.setView(languageDialog)
    val dialog = dialogBuilder.create()
    dialog.show()

    languageDialog.findViewById<Button>(R.id.languageEnglish).setOnClickListener {
      updateUserLanguage(LanguageType.EN)
      dialog.cancel()
    }

    languageDialog.findViewById<Button>(R.id.languageHindi).setOnClickListener {
      updateUserLanguage(LanguageType.HI)
      dialog.cancel()
    }

    languageDialog.findViewById<Button>(R.id.languageBengali).setOnClickListener {
      updateUserLanguage(LanguageType.BN)
      dialog.cancel()
    }

    languageDialog.findViewById<Button>(R.id.languageMalayalam).setOnClickListener {
      updateUserLanguage(LanguageType.ML)
      dialog.cancel()
    }
  }

  fun setLanguageUpdater(updater: (l: LanguageType) -> Unit) {
    languageUpdater = updater
  }

  private fun updateUserLanguage(lang: LanguageType) {
    if (::languageUpdater.isInitialized) {
      languageUpdater(lang)
    }
  }
}
