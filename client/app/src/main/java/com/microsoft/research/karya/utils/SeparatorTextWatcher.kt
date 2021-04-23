// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.utils

import android.text.Editable
import android.text.TextWatcher

/** Custom [TextWatcher] class that appends a given [separator] for every [interval]. */
abstract class SeparatorTextWatcher(
    private val separator: Char,
    private val interval: Int,
) : TextWatcher {

  private var dirty = false
  private var start = 0
  private var before = 0
  private var count = 0

  override fun afterTextChanged(editable: Editable?) {
    if (dirty) return

    dirty = true
    val textAndPosition = handleSeparator(editable.toString())
    onAfterTextChanged(textAndPosition.first, textAndPosition.second)
    dirty = false
  }

  override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
    // Empty
  }

  override fun onTextChanged(s: CharSequence?, _start: Int, _before: Int, _count: Int) {
    start = _start
    before = _before
    count = _count
  }

  private fun handleSeparator(_text: String): Pair<String, Int> {
    var text = _text

    /** Delete an extra character if a separator was removed */
    if (before == 1 && count == 0 && (start + 1).rem(interval + 1) == 0) {
      val builder = StringBuilder(text)
      builder.deleteCharAt(start - 1)
      text = builder.toString()
      start -= 1
    }

    /** Reformat entire text */
    val textWithoutSeparator = text.replace(separator.toString(), "")
    val length = textWithoutSeparator.length
    var insertAt = ((length - 1) / interval) * interval
    val stringBuilder = StringBuilder(textWithoutSeparator)
    while (insertAt > 0) {
      stringBuilder.insert(insertAt, separator)
      insertAt -= interval
    }

    /** If adding a character where a separator would have been added, then add 1 to new position */
    val addToPosition = if (before == 0 && (start + 1).rem(interval + 1) == 0) 1 else 0

    /** Return formatted text and current text position */
    val newText = stringBuilder.toString()
    var newPosition = start + count + addToPosition
    if (newPosition > newText.length) newPosition = newText.length
    return Pair(newText, newPosition)
  }

  /** Subclasses must implement this method to get the formatted text. */
  abstract fun onAfterTextChanged(text: String, position: Int)
}
