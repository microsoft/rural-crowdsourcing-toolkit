package com.microsoft.research.karya.ui.fileDownload

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.ResourceManager
import com.microsoft.research.karya.ui.registration.WorkerInformation
import com.microsoft.research.karya.utils.Result
import com.microsoft.research.karya.utils.extensions.observe
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class FileDownloadFragment : Fragment(R.layout.fragment_file_download) {

    @Inject
    lateinit var resourceManager: ResourceManager


    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        downloadResourceFiles()
    }

    private fun downloadResourceFiles() {
        val fileDownloadFlow = resourceManager.downloadLanguageResources(
            WorkerInformation.creation_code!!,
            WorkerInformation.app_language!!
        )

        fileDownloadFlow.observe(lifecycle, lifecycleScope) { result ->
            when (result) {
                is Result.Success<*> -> navigateToRegistration()
                is Result.Error -> {}
                Result.Loading -> { Toast.makeText(requireContext(), "Loading", Toast.LENGTH_SHORT).show() }
            }
        }
    }

    fun navigateToRegistration() {
        findNavController().navigate(R.id.action_fileDownloadFragment_to_registrationActivity)
    }
}
