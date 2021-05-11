package com.microsoft.research.karya.ui.assistant

import androidx.lifecycle.LifecycleOwner
import dagger.assisted.AssistedFactory

@AssistedFactory
interface AssistantFactory {
  fun create(lifecycleOwner: LifecycleOwner): Assistant
}
