// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utility functions to handle file download, tar balls, etc. */
package com.microsoft.research.karya.utils

import com.microsoft.research.karya.utils.jtar.TarEntry
import com.microsoft.research.karya.utils.jtar.TarInputStream
import com.microsoft.research.karya.utils.jtar.TarOutputStream
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.math.BigInteger
import java.security.MessageDigest
import java.util.zip.GZIPInputStream
import java.util.zip.GZIPOutputStream
import okhttp3.ResponseBody
import retrofit2.Response

object FileUtils {

  /** Download HTTP response stream to a local file path */
  fun downloadFileToLocalPath(response: Response<ResponseBody>, filePath: String): Boolean {
    val downloadedFile = File(filePath)
    val parentDir = downloadedFile.parentFile

    if (parentDir != null && !parentDir.exists()) {
      if (!parentDir.mkdirs()) return false
    }

    if (downloadedFile.exists() && !downloadedFile.delete()) {
      return false
    }

    response.body()!!.byteStream().use { inputStream ->
      FileOutputStream(filePath).use { outputStream -> inputStream.copyTo(outputStream) }
    }

    return true
  }

  /** Extract files in a tar ball into a directory. Delete the tar ball after extraction. */
  fun extractTarBallIntoDirectory(tarBallPath: String, directoryPath: String): Boolean {
    val directory = File(directoryPath)

    if (!directory.exists() && !directory.mkdirs()) {
      return false
    }

    val fis = FileInputStream(tarBallPath)
    val bufferedStream = BufferedInputStream(fis)
    val tarStream = TarInputStream(bufferedStream)

    var entry = tarStream.nextEntry
    while (entry != null) {
      val fileName = entry.name
      val outputStream = FileOutputStream("$directoryPath/$fileName")
      tarStream.copyTo(outputStream)
      outputStream.close()
      entry = tarStream.nextEntry
    }

    tarStream.close()
    bufferedStream.close()
    fis.close()

    // Commenting this out for now.
    // File(tarBallPath).delete()

    return true
  }

  /** Extract files in a GZipped tar ball into a directory. Does not delete the tar ball. */
  @Throws(FileNotFoundException::class)
  fun extractGZippedTarBallIntoDirectory(tarBallPath: String, directoryPath: String): Boolean {
    val directory = File(directoryPath)

    if (!directory.exists() && !directory.mkdirs()) {
      return false
    }

    val fis = FileInputStream(tarBallPath)
    val bufferedStream = BufferedInputStream(fis)
    val gzipInputStream = GZIPInputStream(bufferedStream)
    val tarStream = TarInputStream(gzipInputStream)

    // TODO: Discuss if we should continue extraction when there's an error in one entry
    var entry = tarStream.nextEntry
    while (entry != null) {
      val fileName = entry.name
      File(directoryPath, fileName).createNewFile()
      val outputStream = FileOutputStream("$directoryPath/$fileName")
      tarStream.copyTo(outputStream)
      outputStream.close()
      entry = tarStream.nextEntry
    }

    tarStream.close()
    gzipInputStream.close()
    bufferedStream.close()
    fis.close()

    return true
  }

  fun createTarBall(tarPath: String, filePaths: List<String>, fileNames: List<String>) {
    val fileStream = FileOutputStream(tarPath)
    val gzipStream = GZIPOutputStream(fileStream)
    val tarStream = TarOutputStream(BufferedOutputStream(gzipStream))

    for ((filePath, fileName) in filePaths zip fileNames) {
      val assignmentOutputFile = File(filePath)

      // Update the tar header
      tarStream.putNextEntry(TarEntry(assignmentOutputFile, fileName))

      // Write the file
      val inputStream = FileInputStream(assignmentOutputFile)
      inputStream.copyTo(tarStream)
      inputStream.close()
    }

    tarStream.close()
    gzipStream.close()
    fileStream.close()
  }

  /** Get the MD5 digest for a file */
  fun getMD5Digest(filePath: String): String {
    val digest = MessageDigest.getInstance("MD5")
    val inputStream = FileInputStream(filePath)

    val buffer = ByteArray(8192)
    var readBytes: Int
    while (inputStream.read(buffer).also { readBytes = it } > 0) {
      digest.update(buffer, 0, readBytes)
    }
    val md5sum: ByteArray = digest.digest()
    val bigInt = BigInteger(1, md5sum)
    val output = bigInt.toString(16)

    // Fill to 32 chars
    return "%32s".format(output).replace(' ', '0')
  }

  fun createDirectory(dirPath: String): String {

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

}
