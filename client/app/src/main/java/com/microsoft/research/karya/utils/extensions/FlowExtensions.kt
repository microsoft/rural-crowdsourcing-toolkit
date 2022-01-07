package com.microsoft.research.karya.utils.extensions

import androidx.lifecycle.*
import com.microsoft.research.karya.utils.Result
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

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

fun <T> Flow<T>.throttleFirst(windowDuration: Long): Flow<T> = flow {
  var lastEmissionTime = 0L
  collect { upstream ->
    val currentTime = System.currentTimeMillis()
    val mayEmit = currentTime - lastEmissionTime > windowDuration
    if (mayEmit) {
      lastEmissionTime = currentTime
      emit(upstream)
    }
  }
}
