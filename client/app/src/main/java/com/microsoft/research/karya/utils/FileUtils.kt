// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/** Utility functions to handle file download, tar balls, etc. */
package com.microsoft.research.karya.utils

import com.microsoft.research.karya.utils.jtar.TarInputStream
import java.io.BufferedInputStream
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.zip.GZIPInputStream
import okhttp3.ResponseBody
import retrofit2.Response

object FileUtils {

  /** Download HTTP response stream to a local file path */
  fun downloadFileToLocalPath(response: Response<ResponseBody>, filePath: String) {
    val inputStream = response.body()!!.byteStream()
    val outputStream = FileOutputStream(filePath)
    inputStream.copyTo(outputStream)
    outputStream.close()
    inputStream.close()
  }

  /** Extract files in a tar ball into a directory. Delete the tar ball after extraction. */
  fun extractTarBallIntoDirectory(tarBallPath: String, directoryPath: String) {
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
  }

  /** Extract files in a GZipped tar ball into a directory. Does not delete the tar ball. */
  fun extractGZippedTarBallIntoDirectory(tarBallPath: String, directoryPath: String) {
    val fis = FileInputStream(tarBallPath)
    val bufferedStream = BufferedInputStream(fis)
    val gzipInputStream = GZIPInputStream(bufferedStream)
    val tarStream = TarInputStream(gzipInputStream)

    var entry = tarStream.nextEntry
    while (entry != null) {
      val fileName = entry.name
      val outputStream = FileOutputStream("$directoryPath/$fileName")
      tarStream.copyTo(outputStream)
      outputStream.close()
      entry = tarStream.nextEntry
    }

    tarStream.close()
    gzipInputStream.close()
    bufferedStream.close()
    fis.close()
  }
}
