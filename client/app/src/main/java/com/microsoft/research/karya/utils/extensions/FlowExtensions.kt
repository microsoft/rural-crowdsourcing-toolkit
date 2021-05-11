package com.microsoft.research.karya.utils.extensions

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleCoroutineScope
import androidx.lifecycle.Observer
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.flowWithLifecycle
import com.microsoft.research.karya.utils.Result
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.InternalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onCompletion
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Suppress("USELESS_CAST")
fun <T> Flow<T>.mapToResult(): Flow<Result> {
  return map { response -> (Result.Success(response) as Result) }.onStart { emit(Result.Loading) }.catch { exception ->
    emit(Result.Error(exception))
  }
}

fun <T> Flow<T>.observe(lifecycle: Lifecycle, lifecycleScope: LifecycleCoroutineScope, observer: (T) -> Unit) {
  flowWithLifecycle(lifecycle).onEach { observer(it) }.launchIn(lifecycleScope)
}

@OptIn(InternalCoroutinesApi::class)
fun <T> SavedStateHandle.getStateFlow(
  key: String,
  scope: CoroutineScope,
  initialValue: T? = get(key),
): MutableStateFlow<T?> =
  this.let { handle ->
    val liveData =
      handle.getLiveData<T?>(key, initialValue).also { liveData ->
        if (liveData.value === initialValue) {
          liveData.value = initialValue
        }
      }
    val mutableStateFlow = MutableStateFlow(liveData.value)

    val observer: Observer<T?> = Observer { value ->
      if (value != mutableStateFlow.value) {
        mutableStateFlow.value = value
      }
    }
    liveData.observeForever(observer)

    scope.launch {
      mutableStateFlow.also { flow ->
        flow.onCompletion { withContext(Dispatchers.Main.immediate) { liveData.removeObserver(observer) } }.collect {
          value ->
          withContext(Dispatchers.Main.immediate) {
            if (liveData.value != value) {
              liveData.value = value
            }
          }
        }
      }
    }

    mutableStateFlow
  }
