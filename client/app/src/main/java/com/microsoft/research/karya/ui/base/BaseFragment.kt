package com.microsoft.research.karya.ui.base

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.annotation.LayoutRes
import androidx.fragment.app.Fragment
import com.microsoft.research.karya.ui.assistant.Assistant
import com.microsoft.research.karya.ui.assistant.AssistantFactory
import javax.inject.Inject

abstract class BaseFragment : Fragment {

  constructor() : super()
  constructor(@LayoutRes contentLayoutId: Int) : super(contentLayoutId)

  @Inject lateinit var assistantFactory: AssistantFactory
  lateinit var assistant: Assistant

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    assistant = assistantFactory.create(viewLifecycleOwner)
    return super.onCreateView(inflater, container, savedInstanceState)
  }
}
