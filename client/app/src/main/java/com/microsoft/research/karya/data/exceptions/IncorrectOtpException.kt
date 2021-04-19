package com.microsoft.research.karya.data.exceptions

import com.microsoft.research.karya.data.model.karya.WorkerRecord
import retrofit2.Response

class IncorrectOtpException(message: String): Exception(message)
