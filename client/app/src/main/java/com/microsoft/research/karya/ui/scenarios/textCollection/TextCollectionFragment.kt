package com.microsoft.research.karya.ui.scenarios.textCollection

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class TextCollectionFragment : BaseMTRendererFragment(R.layout.microtask_text_collection) {
  override val viewModel: TextCollectionViewModel by viewModels()
  val args: TextCollectionFragmentArgs by navArgs()

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    viewModel.setupViewModel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupObservers()

  }

  private fun setupObservers() {

  }
}
