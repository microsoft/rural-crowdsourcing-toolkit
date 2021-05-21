// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.model.karya.enums

import com.google.gson.annotations.SerializedName

enum class TaskStatus {
  CREATED,
  SUBMITTED,
    VALIDATING,
   VALIDATED,
  INVALID,
  APPROVING,
  APPROVED,
  ASSIGNED,
  COMPLETED
}
