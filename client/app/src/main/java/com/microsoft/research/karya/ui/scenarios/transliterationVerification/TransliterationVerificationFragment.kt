package com.microsoft.research.karya.ui.scenarios.transliterationVerification

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.scenarios.common.BaseMTRendererFragment
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.android.synthetic.main.transliteration_verification_fragment.*

@AndroidEntryPoint
class TransliterationVerificationFragment : BaseMTRendererFragment(R.layout.transliteration_verification_fragment) {
  override val viewModel: TransliterationVerificationViewModel by viewModels()
  val args: TransliterationVerificationFragmentArgs by navArgs()

  override fun requiredPermissions(): Array<String> {
    return emptyArray()
  }

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
    val view = super.onCreateView(inflater, container, savedInstanceState)
    // TODO: Remove this once we have viewModel Factory
    viewModel.setupViewmodel(args.taskId, 0, 0)
    return view
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)

    setupObservers()

    /** record instruction */
    val recordInstruction =
      viewModel.task.params.asJsonObject.get("instruction").asString ?: ""
    instructionTv.text = recordInstruction

    verificationRecyclerView.layoutManager = LinearLayoutManager(requireContext(), RecyclerView.VERTICAL, false)

    nextBtn.setOnClickListener { viewModel.handleNextClick() }
  }

  private fun setupObservers() {
    viewModel.wordTvText.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { text -> wordTv.text = text }

    viewModel.transliterations.observe(viewLifecycleOwner.lifecycle, viewLifecycleScope) { array ->
      val adapter = WordListAdapter(array, viewModel)
      verificationRecyclerView.adapter = adapter
    }

  }

}
