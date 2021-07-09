package com.microsoft.research.karya.utils

import com.microsoft.research.karya.utils.extensions.getContainerDirectory
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

  /** Get Microtask input directory */
  // TODO [Viewmodel_Refactor]: Ask the structure of input files directory
  fun getMicrotaskInputDirectory(microtaskId: String): String {
    return FileUtils.createDirectory("${cname}/$microtaskId")
  }

  /** Get microtask input file path */
  fun getMicrotaskInputFilePath(microtaskId: String, fileName: String): String {
    val microtaskInputDirectory = getMicrotaskInputDirectory(microtaskId)
    return "$microtaskInputDirectory/$fileName"
  }

}

class MicrotaskAssignmentOutput(fileDirPath: String) : KaryaFileContainer("microtask-assignment-output", fileDirPath) {
  override fun getBlobName(vararg params: String): String {
    val assignmentId = params[0]
    val ext = "tgz"
    return "$assignmentId.$ext"
  }

  /**
   * Get the unique file name of the output for current assignment. [params] is a pair of strings: a
   * file identifier and extension. The file name is usually the current assignmentID appended with
   * the identifier. The full file name is unique for a unique [params] pair.
   */
  fun getAssignmentFileName(assignmentId: String, params: Pair<String, String>): String {
    val identifier = params.first
    val extension = params.second

    return if (identifier == "") "$assignmentId.$extension" else "$assignmentId-$identifier.$extension"
  }

  fun getAssignmentOutputFilePath(assignmentId: String, params: Pair<String, String>): String {
    val directory = getContainerDirectory()
    val fileName = getAssignmentFileName(assignmentId, params)
    return "$directory/$fileName"
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
