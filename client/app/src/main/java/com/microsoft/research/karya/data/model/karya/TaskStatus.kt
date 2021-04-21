// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * This file was auto-generated using specs and scripts in the db-schema repository. DO NOT EDIT
 * DIRECTLY.
 */
package com.microsoft.research.karya.data.model.karya

enum class TaskStatus {
  created,
  submitted,
  validating,
  validated,
  invalid,
  approving,
  approved,
  assigned,
  completed
}
