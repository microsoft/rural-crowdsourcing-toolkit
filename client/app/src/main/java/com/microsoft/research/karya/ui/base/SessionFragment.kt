package com.microsoft.research.karya.ui.base

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.annotation.LayoutRes
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager

abstract class SessionFragment : BaseFragment {
  constructor() : super()
  constructor(@LayoutRes contentLayoutId: Int) : super(contentLayoutId)

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    AuthManager.sessionAlive.observe(viewLifecycleOwner, { sessionAlive ->
      if (!sessionAlive) {
        onSessionExpired()
      }
    })
    return super.onCreateView(inflater, container, savedInstanceState)
  }

  protected open fun onSessionExpired() {
    findNavController().navigate(R.id.action_global_loginFlow)
  }
}
