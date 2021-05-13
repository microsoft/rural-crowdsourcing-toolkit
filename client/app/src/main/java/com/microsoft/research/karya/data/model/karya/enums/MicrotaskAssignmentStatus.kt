// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.model.karya.enums

import com.google.gson.annotations.SerializedName

enum class MicrotaskAssignmentStatus {
  @SerializedName("assigned") ASSIGNED,
  @SerializedName("incomplete") INCOMPLETE,
  @SerializedName("skipped") SKIPPED,
  @SerializedName("expired") EXPIRED,
  @SerializedName("completed") COMPLETED,
  @SerializedName("submitted") SUBMITTED,
  @SerializedName("verified") VERIFIED
}
