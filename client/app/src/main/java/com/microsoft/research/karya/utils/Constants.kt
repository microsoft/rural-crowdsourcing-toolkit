package com.microsoft.research.karya.utils

object Constants {

  /**
   * The maximum duration of inactivity which is allowed.
   */
  const val TIMEOUT_DURATION_MILLIS = (30 * 1000).toLong()

  /**
   * Maximum numbers of timeouts that is user is allowed to have,
   * once this limit is crossed, user will not be able to
   * any tasks till [ALLOW_AFTER_TIMEOUT_DURATION_MILLIS]
   */
  const val MAX_ALLOWED_TIMEOUTS = 3

  /**
   * Duration after which a user is allowed to do any
   * tasks once maximum timeouts has been reached
   */
  const val ALLOW_AFTER_TIMEOUT_DURATION_MILLIS = (10 * 60 * 1000).toLong()
}
