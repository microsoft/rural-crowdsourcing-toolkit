package com.microsoft.research.karya.utils.extensions

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleCoroutineScope
import androidx.lifecycle.flowWithLifecycle
import com.microsoft.research.karya.utils.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart

@Suppress("USELESS_CAST")
fun <T> Flow<T>.mapToResult(): Flow<Result> {
  return map { response -> (Result.Success(response) as Result) }
      .onStart { emit(Result.Loading) }
      .catch { exception -> emit(Result.Error(exception)) }
}

fun <T> Flow<T>.observe(
    lifecycle: Lifecycle,
    lifecycleScope: LifecycleCoroutineScope,
    observer: (T) -> Unit
) {
  flowWithLifecycle(lifecycle).onEach { observer(it) }.launchIn(lifecycleScope)
}
