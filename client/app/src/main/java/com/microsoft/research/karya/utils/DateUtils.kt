package com.microsoft.research.karya.utils

import java.text.SimpleDateFormat
import java.util.*

object DateUtils {

  fun getCurrentDate(): String {
    val date = Date()
    val simpleDateTimeFormatter =
      SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    SimpleDateFormat.getDateTimeInstance()
    simpleDateTimeFormatter.timeZone = TimeZone.getTimeZone("UTC")
    return simpleDateTimeFormatter.format(date)
  }
}
