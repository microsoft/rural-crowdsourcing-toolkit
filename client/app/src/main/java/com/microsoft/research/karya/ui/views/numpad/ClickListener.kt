// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Click listener for numeric pad

package com.microsoft.research.karya.ui.views.numpad

import android.view.View
import android.widget.EditText
import java.lang.StringBuilder
import kotlin.math.min

// Key types
enum class KeyType {
  DIGIT,
  DELETE
}

class ClickListener(
  private val field: EditText?,
  private val maxLength: Int,
  private val type: KeyType,
  private val keyDigit: Char,
) : View.OnClickListener {

  override fun onClick(view: View?) {
    val field = this.field ?: return
    when (type) {
      KeyType.DIGIT -> field.insertDigit(keyDigit)
      KeyType.DELETE -> field.deleteDigit()
    }
  }

  /**
   * Insert new digit at current location
   */
  private fun EditText.insertDigit(char: Char) {
    // If insertion will exceed max length, return
    if (maxLength > 0 && text.length >= maxLength) return

    val cursorLocation = selectionEnd
    val updatedText = StringBuilder()
      .append(text.subSequence(0, cursorLocation))
      .append(char)
      .append(text.subSequence(cursorLocation, text.length))
    setText(updatedText)
    setSelection(min(cursorLocation + 1, text.length))
  }

  /**
   * Remove digit at current location
   */
  private fun EditText.deleteDigit() {
    val deleteLocation = selectionEnd - 1
    if (deleteLocation < 0) return

    val updatedText = StringBuilder()
      .append(text.subSequence(0, deleteLocation))
      .append(text.subSequence(deleteLocation + 1, text.length))
    setText(updatedText)
    setSelection(min(deleteLocation, text.length))
  }
}