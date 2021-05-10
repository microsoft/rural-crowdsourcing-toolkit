package com.microsoft.research.karya.utils

import java.io.File
import java.io.FileNotFoundException

/** Helper enum for accessing karya files */
sealed class KaryaFileContainer(val cname: String, val fileDirPath: String) {

  /** Get the local directory path for a container */
  fun getDirectory(): String {
    val dirPath = "$fileDirPath/$cname"
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

class LANG_RES(fileDirPath: String) : KaryaFileContainer("lang-res", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val lrId = params[0]
    val languageId = params[1]
    val ext = "m4a"
    return "$lrId-$languageId.$ext"
  }
}

class L_LRVS(fileDirPath: String) : KaryaFileContainer("l-lrvs", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val languageId = params[0]
    val ext = "tar"
    return "L-$languageId.$ext"
  }
}

class LR_LRVS(fileDirPath: String) : KaryaFileContainer("lr-lrvs", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val lrId = params[0]
    val ext = "tar"
    return "LR-$lrId.$ext"
  }
}

class MICROTASK_INPUT(fileDirPath: String) : KaryaFileContainer("microtask-input", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val microtaskId = params[0]
    val ext = "tgz"
    return "$microtaskId.$ext"
  }
}

class MICROTASK_ASSIGNMENT_OUTPUT(fileDirPath: String) :
  KaryaFileContainer("microtask-assignment-output", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val assignmentId = params[0]
    val ext = "tgz"
    return "$assignmentId.$ext"
  }
}

class WORKER_LOGS(fileDirPath: String) : KaryaFileContainer("worker-logs", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val workerId = params[0]
    val timestamp = params[1]
    val ext = "gz"
    return "$workerId-$timestamp.$ext"
  }
}
