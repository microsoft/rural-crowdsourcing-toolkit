package com.microsoft.research.karya.ui.scenarios.common

import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.annotation.LayoutRes
import androidx.core.content.ContextCompat.checkSelfPermission
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.extensions.observe

abstract class BaseMTRendererFragment(@LayoutRes contentLayoutId: Int) : BaseFragment(contentLayoutId) {

  abstract val viewModel: BaseMTRendererViewModel

  companion object {
    /** Code to request necessary permissions */
    private const val REQUEST_PERMISSIONS = 201

    // Flag to indicate if app has all permissions
    private var hasAllPermissions: Boolean = true
  }

  /** Function to return the set of permission needed for the task */
  open fun requiredPermissions(): Array<String> {
    return arrayOf()
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setUpObservers()
    /** Check if there are any permissions needed */
    val permissions = requiredPermissions()
    if (permissions.isNotEmpty()) {
      for (permission in permissions) {
        if (checkSelfPermission(requireContext(), permission) != PackageManager.PERMISSION_GRANTED) {
          hasAllPermissions = false
          requestPermissions(permissions, REQUEST_PERMISSIONS)
          break
        }
      }
    }

    if (hasAllPermissions) {
      viewModel.getAndSetupMicrotask()
    }
  }

  /** On permission result, if any permission is not granted, return immediately */
  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray,
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)

    /** If request code does not belong to this activity, return */
    if (requestCode != REQUEST_PERMISSIONS) return

    /** If any of the permissions were not granted, return */
    for (result in grantResults) {
      if (result != PackageManager.PERMISSION_GRANTED) {
        findNavController().popBackStack()
      }
    }

    hasAllPermissions = true
    viewModel.getAndSetupMicrotask()
  }

  private fun setUpObservers() {
    viewModel.navigateBack.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { pop ->
      if (pop) {
        findNavController().popBackStack()
      }
    }

    viewModel.inputFileDoesNotExist.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { notExist ->
      if (notExist) {
        Toast.makeText(requireContext(), getString(R.string.input_file_does_not_exist), Toast.LENGTH_LONG).show()
      }
    }
  }
}
