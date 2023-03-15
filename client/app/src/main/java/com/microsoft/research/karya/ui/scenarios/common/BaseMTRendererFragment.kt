package com.microsoft.research.karya.ui.scenarios.common

import android.app.AlertDialog
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Toast
import androidx.annotation.LayoutRes
import androidx.core.content.ContextCompat.checkSelfPermission
import androidx.datastore.preferences.core.edit
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.microsoft.research.karya.R
import com.microsoft.research.karya.ui.MainActivity
import com.microsoft.research.karya.ui.base.BaseFragment
import com.microsoft.research.karya.utils.Constants
import com.microsoft.research.karya.utils.DateUtils
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewLifecycleScope
import kotlinx.android.synthetic.main.microtask_common_header.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

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
      inactivityTimeout = Constants.TIMEOUT_DURATION_MILLIS,
      onInactivityTimeout = { viewLifecycleScope.launch { handleInactivityTimeout(it) } }
    )
    (requireActivity() as MainActivity).setUserInteractionCallback { userInteractionListener.restartTimeout() }
  }

  private suspend fun handleInactivityTimeout(inactivityCount: Int) {
    val worker = authManagerBase.getLoggedInWorker()
    val tags = worker.params!!.asJsonObject.getAsJsonArray("tags")
    val workerTags = tags.map { it.asString }
    if (!workerTags.contains("_handle_inactivity_")) return
    if (inactivityCount <= Constants.MAX_ALLOWED_TIMEOUTS) {
      var dialogTimeoutJob: Job? = null
      val dialogBuilder = AlertDialog.Builder(requireContext())
        .setTitle(getString(R.string.inactivity_timeout_title, (Constants.TIMEOUT_DURATION_MILLIS / 1000)))
        .setMessage(R.string.inactivity_timeout_message)
        .setNegativeButton(R.string.cancel_text) { _, _ ->
          // if dialog is shown, then we're sure that userInteractionListener is initialised so it is safe to directly use restartTimeout()
          userInteractionListener.restartTimeout()
          // cancel the dialog timeout
          dialogTimeoutJob?.cancel()
        }
        .setPositiveButton(R.string.okay) { _, _ ->
          userInteractionListener.restartTimeout()
          dialogTimeoutJob?.cancel()
        }
        .create()
      dialogBuilder.show()

      // Create a timer to auto dismiss the dialog after 30s
      // if the dialog is dismissed manually, the job should get cancelled
      var dialogTimer = 30
      dialogTimeoutJob = viewLifecycleOwner.lifecycleScope.launch(Dispatchers.IO) {
        while (isActive && dialogTimer > 0) {
          delay(1000)
          dialogTimer--
          Log.d("BaseMTRendererFragment::handleInactivityTimeout", "Dialog will automatically dismiss in: $dialogTimer")
        }
        dialogBuilder.dismiss()
        if (isActive) findNavController().popBackStack()
      }
    } else {
      // the user has passed maximum allowed timeouts
      viewLifecycleOwner.lifecycleScope.launch {
        viewModel.expireAllTasks()
        Toast.makeText(
          requireContext(),
          getString(R.string.max_timeout_reached_msg, Constants.MAX_ALLOWED_TIMEOUTS),
          Toast.LENGTH_SHORT
        ).show()
        requireContext().dataStore.edit { it[PreferenceKeys.INACTIVITY_TIMEOUT] = System.currentTimeMillis() }
        // navigate back to dashboard
        findNavController().popBackStack()
      }
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

  override fun onPause() {
    super.onPause()
    viewModel.log("BaseMTRendererFragment::onPause()")
  }

  override fun onResume() {
    super.onResume()
    viewModel.log("BaseMTRendererFragment::onResume()")
  }

}
