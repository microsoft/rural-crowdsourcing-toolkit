// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.ui.registration

import android.graphics.Bitmap

object WorkerInformation {
    var id_token: String? = null // TODO: Save it in shared preferences
    var app_language: Int? = null
    var creation_code: String? = null
    var phone_number: String? = null
    var otp: String? = null
    var profile_picture: Bitmap? = null
    var gender: String? = null
    var age_group: String? = null
}
