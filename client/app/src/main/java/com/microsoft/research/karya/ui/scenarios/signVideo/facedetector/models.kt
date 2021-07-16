package com.microsoft.research.karya.ui.scenarios.signVideo.facedetector

import android.util.Size

data class Frame(
    @Suppress("ArrayInDataClass") val data: ByteArray?,
    val rotation: Int,
    val size: Size,
    val format: Int,
    val lensFacing: LensFacing
)