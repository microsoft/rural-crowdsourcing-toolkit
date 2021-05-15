package com.microsoft.research.karya.utils.extensions

import com.microsoft.research.karya.utils.KaryaFileContainer

fun KaryaFileContainer.getContainerDirectory(): String {
  return getDirectory()
}

/** Get the blob path for a blob in the [container] with specific [params] */
fun KaryaFileContainer.getBlobPath(vararg params: String): String {
  val dir = getContainerDirectory()
  val name = getBlobName(*params)
  return "$dir/$name"
}
