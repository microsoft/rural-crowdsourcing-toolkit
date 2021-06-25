package com.microsoft.research.karya.ui.scenarios.transliteration.validator

class Validator {
  companion object {

    fun isValid(word: String): Boolean {
      if (word.startsWith("xyz")) { return false }
      return true
    }

  }
}