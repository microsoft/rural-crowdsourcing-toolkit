package com.microsoft.research.karya.ui.scenarios.common

import android.app.AlertDialog
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.View
import androidx.annotation.LayoutRes
import androidx.core.content.ContextCompat.checkSelfPermission
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.DateUtils
import com.microsoft.research.karya.utils.extensions.observe
import kotlinx.android.synthetic.main.microtask_common_header.*

abstract class BaseMTRendererFragment(@LayoutRes contentLayoutId: Int) :
  BaseFragment(contentLayoutId) {

  abstract val viewModel: BaseMTRendererViewModel
  private lateinit var userInteractionListener: UserInteractionListener

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
        if (checkSelfPermission(
            requireContext(),
            permission
          ) != PackageManager.PERMISSION_GRANTED
        ) {
          hasAllPermissions = false
          requestPermissions(permissions, REQUEST_PERMISSIONS)
          break
        }
      }
    }

    if (hasAllPermissions) {
      viewModel.getAndSetupMicrotask()
    }


    userInteractionListener = UserInteractionListener(
      lifecycleOwner = viewLifecycleOwner,
      inactivityTimeout = 10000,
      onInactivityTimeout = { showTimeoutDialog() }
    )
    (requireActivity() as MainActivity).setUserInteractionCallback { userInteractionListener.restartTimeout() }
  }

  private fun showTimeoutDialog() {
    AlertDialog.Builder(requireContext())
      .setTitle("No activity for more than 30s was observed")
      .setMessage("Please tap okay to start doing work!")
      .setNegativeButton(R.string.cancel_text) { _, _ ->
        // if dialog is shown, then we're sure that userInteractionListener is initialised so it is safe to directly use restartTimeout()
        userInteractionListener.restartTimeout()
      }
      .setPositiveButton(R.string.okay) { _, _ ->
        userInteractionListener.restartTimeout()
      }
      .show()
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
    viewModel.completedAssignments.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { completed ->
      microtaskProgressPb.progress = completed
    }

    viewModel.totalAssignments.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { total ->
      microtaskProgressPb.max = total
    }

    viewModel.navigateBack.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { pop ->
      if (pop) {
        findNavController().popBackStack()
      }
    }

    viewModel.inputFileDoesNotExist.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { notExist ->
      if (notExist) {
        // Toast.makeText(requireContext(), getString(R.string.input_file_does_not_exist), Toast.LENGTH_LONG).show()
      }
    }

    viewModel.outsideTimeBound.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { outside ->
      if (outside.first) {
        val builder = AlertDialog.Builder(requireContext())
        val startTime = DateUtils.convert24to12(outside.second)
        val endTime = DateUtils.convert24to12(outside.third)

        val message = getString(R.string.task_outside_time_bound)
          .replace("_START_TIME_", startTime)
          .replace("_END_TIME_", endTime)
        builder.setMessage(message)
        builder.setNeutralButton(R.string.okay) { _, _ ->
          findNavController().popBackStack()
        }
        val dialog = builder.create()
        dialog.show()
      }
    }

    viewModel.holidayMessage.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { messagePair ->
      if (messagePair.first) {
        val messageRes = messagePair.second
        val message = requireContext().getString(messageRes)

        val builder = AlertDialog.Builder(requireContext())
        builder.setMessage(message)
        builder.setNeutralButton(R.string.okay) { _, _ ->
          findNavController().popBackStack()
        }
        val dialog = builder.create()
        dialog.show()
      }
    }
  }

  fun skipTask(showAlertBox: Boolean, title: String, msg: String) {

    if (!showAlertBox) {
      viewModel.skipTask()
      return
    }

    val alertDialog: AlertDialog? = activity?.let {
      val builder = AlertDialog.Builder(it)
      builder.apply {
        setPositiveButton(
          getString(R.string.okay)
        ) { _, _ ->
          viewModel.skipTask()
        }
        setNegativeButton(
          getString(R.string.cancel_text)
        ) { _, _ ->
          // User cancelled the dialog
        }
      }

      builder.setMessage(msg)
        .setTitle(title)
      // Create the AlertDialog
      builder.create()
    }
    alertDialog!!.show()
  }

}
