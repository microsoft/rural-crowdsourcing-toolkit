package com.microsoft.research.karya.utils.extensions

import com.microsoft.research.karya.utils.KaryaFileContainer

fun getContainerDirectory(container: KaryaFileContainer): String {
  return container.getDirectory()
}

/** Get the blob name for a [container] with specific [params] */
fun getBlobName(container: KaryaFileContainer, vararg params: String): String {
  return container.getBlobName(*params)
}

/** Get the blob path for a blob in the [container] with specific [params] */
fun getBlobPath(container: KaryaFileContainer, vararg params: String): String {
  val dir = getContainerDirectory(container)
  val name = getBlobName(container, *params)
  return "$dir/$name"
}
