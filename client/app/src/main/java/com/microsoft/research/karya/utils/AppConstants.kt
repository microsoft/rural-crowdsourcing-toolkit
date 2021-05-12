// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.utils

object AppConstants {

  /** Activity inputs */

  // Skill specification activity
  const val LANGUAGE_ID_FOR_SKILLS: String = "LANGUAGE_ID_FOR_SKILLS"

  // Register skills
  const val CAN_READ: String = "CAN_READ"
  const val CAN_SPEAK: String = "CAN_SPEAK"
  const val CAN_TYPE: String = "CAN_TYPE"

  /** Activity caller states */
  const val SELECT_APP_LANGUAGE_CALLER: String = "SELECT_APP_LANGUAGE_CALLER"
  const val SKILL_SPECIFICATION_CALLER: String = "SKILL_SPECIFICATION_CALLER"
  const val SKILLED_LANGUAGE_LIST_CALLER: String = "SKILLED_LANGUAGE_LIST_CALLER"
  const val DASHBOARD_CALLER: String = "DASHBOARD_CALLER"

  /** Callers */
  const val SPLASH_SCREEN = 3
  const val FETCH_DATA_ON_INIT = 1
  const val DASHBOARD = 2
  const val FETCH_FILE_FOR_APP_LANGUAGE = 4
  const val REGISTER_WORKER = 5
  const val SKILLED_LANGUAGE_LIST = 6
  const val REGISTER_SKILL = 7

  const val PHONE_NUMBER_LENGTH = 10
  const val OTP_LENGTH = 6

  const val INITIAL_TIME = "1970-01-01T00:00:00Z"
}
