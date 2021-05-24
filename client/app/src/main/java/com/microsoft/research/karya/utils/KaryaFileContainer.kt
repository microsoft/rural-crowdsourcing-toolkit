package com.microsoft.research.karya.utils

import java.io.File
import java.io.FileNotFoundException

/** Helper enum for accessing karya files */
sealed class KaryaFileContainer(val cname: String, val fileDirPath: String) {

  /** Get the local directory path for a container */
  fun getDirectory(path: String = ""): String {
    var dirPath = "$fileDirPath/$cname/$path"
    val dir = File(dirPath)

    var success = true
    if (!dir.exists()) {
      success = dir.mkdirs()
    }

    if (success) {
      return dirPath
    } else {
      throw FileNotFoundException()
    }
  }

  /** get the blob name for a particular container given the parameters */
  abstract fun getBlobName(vararg params: String): String
}

class LangRes(fileDirPath: String) : KaryaFileContainer("lang-res", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val lrId = params[0]
    val languageId = params[1]
    val ext = "m4a"
    return "$lrId-$languageId.$ext"
  }
}

class MicrotaskInput(fileDirPath: String) : KaryaFileContainer("microtask-input", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val microtaskId = params[0]
    val ext = "tgz"
    return "$microtaskId.$ext"
  }
}

class MicrotaskAssignmentOutput(fileDirPath: String) : KaryaFileContainer("microtask-assignment-output", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val assignmentId = params[0]
    val ext = "tgz"
    return "$assignmentId.$ext"
  }
}

class WorkerLogs(fileDirPath: String) : KaryaFileContainer("worker-logs", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val workerId = params[0]
    val timestamp = params[1]
    val ext = "gz"
    return "$workerId-$timestamp.$ext"
  }
}
