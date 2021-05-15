// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
package com.microsoft.research.karya.data.model.karya.enums

import com.google.gson.annotations.SerializedName

enum class FileCreator {
  @SerializedName("worker") WORKER,
  @SerializedName("box") BOX,
  @SerializedName("server") SERVER
}
