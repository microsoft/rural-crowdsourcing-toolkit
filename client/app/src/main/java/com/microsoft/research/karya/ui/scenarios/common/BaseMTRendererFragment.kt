package com.microsoft.research.karya.ui.scenarios.common

import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import androidx.annotation.LayoutRes
import androidx.core.content.ContextCompat.checkSelfPermission
import com.microsoft.research.karya.ui.base.BaseFragment

/** Code to request necessary permissions */
private const val REQUEST_PERMISSIONS = 201
// Flag to indicate if app has all permissions
private var hasAllPermissions: Boolean = true

abstract class BaseMTRendererFragment(@LayoutRes contentLayoutId: Int) : BaseFragment(contentLayoutId) {

  abstract val viewmodel: BaseMTRendererViewModel


  /** Function to return the set of permission needed for the task */
  open fun requiredPermissions(): Array<String> {
    return arrayOf()
  }

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
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
//      viewmodel.getAndSetupMicrotask()
      // TODO: SHIFT PERMISSIONS TO EACH FRAGMENT
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
        // TODO: Move back to dashboard and push back the information of selected task
        return
      }
    }

    hasAllPermissions = true
    viewmodel.getAndSetupMicrotask()
  }

}