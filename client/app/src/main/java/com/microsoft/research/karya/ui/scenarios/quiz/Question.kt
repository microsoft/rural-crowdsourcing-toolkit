package com.microsoft.research.karya.ui.scenarios.quiz

enum class QuestionType {
  text,
  mcq,
  invalid
}

data class Question(
  val type: QuestionType,
  val question: String = "",
  val key: String = "",
  val long: Boolean? = false,
  val options: ArrayList<String>? = arrayListOf(),
  val multiple: Boolean? = false
)
