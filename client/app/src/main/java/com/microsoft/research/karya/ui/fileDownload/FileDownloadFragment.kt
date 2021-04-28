package com.microsoft.research.karya.ui.fileDownload

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.hilt.navigation.fragment.hiltNavGraphViewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.ui.accesscode.AccessCodeViewModel
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.observe
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.flow.single

@AndroidEntryPoint
class FileDownloadFragment : Fragment(R.layout.fragment_file_download) {

  val viewModel by hiltNavGraphViewModels<AccessCodeViewModel>(R.id.access_code_nav_graph)
  @Inject lateinit var resourceManager: ResourceManager

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    lifecycleScope.launchWhenStarted { downloadResourceFiles() }
  }

  private suspend fun downloadResourceFiles() {
    // TODO: Should we pass accessCode from the accessCode Fragment?
    val accessCode = viewModel.currentWorkerAccessCode
    val worker = viewModel.getWorkerByAccessCode(accessCode).single()

    val fileDownloadFlow = resourceManager.downloadLanguageResources(worker.accessCode, worker.appLanguage)

    fileDownloadFlow.observe(lifecycle, lifecycleScope) { result ->
      when (result) {
        is Result.Success<*> -> navigateToRegistration()
        is Result.Error -> {}
        Result.Loading -> {
          Toast.makeText(requireContext(), "Loading", Toast.LENGTH_SHORT).show()
        }
      }
    }
  }

  fun navigateToRegistration() {
    findNavController().navigate(R.id.action_fileDownloadFragment_to_registrationActivity)
    findNavController().popBackStack()
  }
}
