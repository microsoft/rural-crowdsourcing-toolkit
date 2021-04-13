package com.microsoft.research.karya.utils.extensions

import android.content.Context
import com.microsoft.research.karya.ui.base.BaseActivity

fun Context.getContainerDirectory(container: BaseActivity.KaryaFileContainer): String {
    return container.getDirectory(this)
}

/**
 * Get the blob name for a [container] with specific [params]
 */
fun Context.getBlobName(container: BaseActivity.KaryaFileContainer, vararg params: String): String {
    return container.getBlobName(*params)
}

/**
 * Get the blob path for a blob in the [container] with specific [params]
 */
fun Context.getBlobPath(container: BaseActivity.KaryaFileContainer, vararg params: String): String {
    val dir = getContainerDirectory(container)
    val name = getBlobName(container, *params)
    return "$dir/$name"
}
