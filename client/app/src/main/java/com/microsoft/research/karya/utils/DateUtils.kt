package com.microsoft.research.karya.utils

import java.text.SimpleDateFormat
import java.util.*

object DateUtils {

  fun getCurrentDate(offset: Int = 0): String {
    val date = Date(Date().time + offset * 24 * 60 * 60 * 1000)
    val simpleDateTimeFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    SimpleDateFormat.getDateTimeInstance()
    simpleDateTimeFormatter.timeZone = TimeZone.getTimeZone("UTC")
    return simpleDateTimeFormatter.format(date)
  }

  fun convert24to12(time24: String): String {
    return try {
      val _24SDF = SimpleDateFormat("HH:mm", Locale.US)
      val _12SDF = SimpleDateFormat("hh:mm a", Locale.US)
      val date24 = _24SDF.parse(time24)
      _12SDF.format(date24)
    } catch (e: Exception) {
      time24
    }
  }
}
