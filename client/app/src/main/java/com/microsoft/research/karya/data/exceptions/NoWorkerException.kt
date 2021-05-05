package com.microsoft.research.karya.data.exceptions

class NoWorkerException : Exception {
  constructor() : super()
  constructor(message: String) : super(message)
}
