// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.model.karya.enums

import com.google.gson.annotations.SerializedName

enum class TaskStatus {
  @SerializedName("created") CREATED,
  @SerializedName("submitted") SUBMITTED,
  @SerializedName("validating") VALIDATING,
  @SerializedName("validated") VALIDATED,
  @SerializedName("invalid") INVALID,
  @SerializedName("approving") APPROVING,
  @SerializedName("approved") APPROVED,
  @SerializedName("assigned") ASSIGNED,
  @SerializedName("completed") COMPLETED
}
