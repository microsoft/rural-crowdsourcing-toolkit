// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.data.model.karya.modelsExtra

data class WorkerLanguageSkillObject(
  var worker_id: String,
  var language_id: Int,
  var can_speak: Boolean,
  var can_type: Boolean,
  var can_read: Boolean,
  var speak_score: Float,
  var type_score: Float,
  var read_score: Float,
)
