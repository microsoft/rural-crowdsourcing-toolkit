package com.microsoft.research.karya.utils.extensions

import android.view.View
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

fun View.visible() {
  this.visibility = View.VISIBLE
}

fun View.invisible() {
  this.visibility = View.INVISIBLE
}

fun View.gone() {
  this.visibility = View.GONE
}

fun View.enable() {
  this.isEnabled = true
}

fun View.disable() {
  this.isEnabled = false
}

@OptIn(ExperimentalCoroutinesApi::class)
fun View.clicks(): Flow<Unit> = callbackFlow {
    setOnClickListener { trySend(Unit) }
    awaitClose { setOnClickListener(null) }
}
