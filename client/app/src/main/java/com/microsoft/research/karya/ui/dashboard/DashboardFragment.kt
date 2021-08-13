package com.microsoft.research.karya.ui.dashboard

import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Bundle
import android.view.View
import androidx.fragment.app.viewModels
import androidx.lifecycle.Observer
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.FragmentDashboardBinding
import com.microsoft.research.karya.ui.base.SessionFragment
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

private const val UNIQUE_SYNC_WORK_NAME = "syncWork"

enum class ERROR_TYPE {
  SYNC_ERROR, TASK_ERROR
}

enum class ERROR_LVL {
  WARNING, ERROR
}

@AndroidEntryPoint
class DashboardFragment : SessionFragment(R.layout.fragment_dashboard) {

  val binding by viewBinding(FragmentDashboardBinding::bind)
  val viewModel: NgDashboardViewModel by viewModels()
  private lateinit var syncWorkRequest: OneTimeWorkRequest

  @Inject
  lateinit var authManager: AuthManager

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    setupWorkRequests()
    observeUi()
  }

  private fun observeUi() {
    viewModel.dashboardUiState.observe(lifecycle, lifecycleScope) { dashboardUiState ->
      when (dashboardUiState) {
        is DashboardUiState.Success -> showSuccessUi(dashboardUiState.data)
        is DashboardUiState.Error -> showErrorUi(dashboardUiState.throwable, ERROR_TYPE.TASK_ERROR, ERROR_LVL.ERROR)
        DashboardUiState.Loading -> showLoadingUi()
      }
    }

    viewModel.progress.observe(lifecycle, lifecycleScope) { i ->
      binding.syncProgressBar.progress = i
    }

    WorkManager.getInstance(requireContext()).getWorkInfosForUniqueWorkLiveData(UNIQUE_SYNC_WORK_NAME)
        .observe(viewLifecycleOwner, { workInfos ->
          if (workInfos.size == 0) return@observe // Return if the workInfo List is empty
          val workInfo = workInfos[0] // Picking the first workInfo
          if (workInfo != null && workInfo.state == WorkInfo.State.SUCCEEDED) {
            lifecycleScope.launch {
              val warningMsg = workInfo.outputData.getString("warningMsg")
              if (warningMsg != null) { // Check if there are any warning messages set by Workmanager
                showErrorUi(Throwable(warningMsg), ERROR_TYPE.SYNC_ERROR, ERROR_LVL.WARNING)
              }
              viewModel.setProgress(100)
              viewModel.refreshList()
            }
          }
          if (workInfo != null && workInfo.state == WorkInfo.State.ENQUEUED) {
            viewModel.setProgress(0)
            viewModel.setLoading()
          }
          if (workInfo != null && workInfo.state == WorkInfo.State.RUNNING) {
            // Check if the current work's state is "successfully finished"
            val progress: Int = workInfo.progress.getInt("progress", 0)
            viewModel.setProgress(progress)
            viewModel.setLoading()
          }
          if (workInfo != null && workInfo.state == WorkInfo.State.FAILED) {
            lifecycleScope.launch {
              showErrorUi(Throwable(workInfo.outputData.getString("errorMsg")), ERROR_TYPE.SYNC_ERROR, ERROR_LVL.ERROR)
              viewModel.refreshList()
            }
          }
        })

  }

  override fun onSessionExpired() {
    WorkManager.getInstance(requireContext()).cancelAllWork()
    super.onSessionExpired()
  }

  override fun onResume() {
    super.onResume()
    viewModel.getAllTasks() // TODO: Remove onResume and get taskId from scenario viewmodel (similar to onActivity Result)
  }

  private fun setupWorkRequests() {
    // TODO: SHIFT IT FROM HERE
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    syncWorkRequest = OneTimeWorkRequestBuilder<DashboardSyncWorker>()
        .setConstraints(constraints)
        .build()
  }

  private fun setupViews() {

    with(binding) {
      tasksRv.apply {
        adapter = TaskListAdapter(emptyList(), ::onDashboardItemClick)
        layoutManager = LinearLayoutManager(context)
      }

      binding.syncCv.setOnClickListener { syncWithServer() }

      appTb.setTitle(getString(R.string.s_dashboard_title))
      appTb.setProfileClickListener { findNavController().navigate(R.id.action_global_tempDataFlow) }
      loadProfilePic()
    }
  }

  private fun syncWithServer() {
    setupWorkRequests()

    WorkManager.getInstance(requireContext())
        .enqueueUniqueWork(UNIQUE_SYNC_WORK_NAME, ExistingWorkPolicy.KEEP, syncWorkRequest)
  }

  private fun showSuccessUi(data: DashboardStateSuccess) {
    WorkManager.getInstance(requireContext()).getWorkInfoByIdLiveData(syncWorkRequest.id)
        .observe(viewLifecycleOwner, Observer { workInfo ->
          if (workInfo == null || workInfo.state == WorkInfo.State.SUCCEEDED || workInfo.state == WorkInfo.State.FAILED) {
            hideLoading() // Only hide loading if no work is in queue
          }
        })
    binding.syncCv.enable()
    data.apply {
      (binding.tasksRv.adapter as TaskListAdapter).updateList(taskInfoData)
      // Show total credits if it is greater than 0
      /* if (totalCreditsEarned > 0.0f) {
        binding.rupeesEarnedCl.visible()
        binding.rupeesEarnedTv.text = "%.2f".format(totalCreditsEarned)
      } else {
        binding.rupeesEarnedCl.gone()
      } */
    }
  }

  private fun showErrorUi(throwable: Throwable, errorType: ERROR_TYPE, errorLvl: ERROR_LVL) {
    hideLoading()
    showError(throwable.message!!, errorType, errorLvl)
    binding.syncCv.enable()
  }

  private fun showError(message: String, errorType: ERROR_TYPE, errorLvl: ERROR_LVL) {
    if (errorType == ERROR_TYPE.SYNC_ERROR) {
      with(binding) {
        syncErrorMessageTv.text = message

        when (errorLvl) {
          ERROR_LVL.ERROR -> syncErrorMessageTv.setTextColor(Color.RED)
          ERROR_LVL.WARNING -> syncErrorMessageTv.setTextColor(Color.YELLOW)
        }
        syncErrorMessageTv.visible()
      }
    }
  }

  private fun showLoadingUi() {
    showLoading()
    binding.syncCv.disable()
    binding.syncErrorMessageTv.gone()
  }

  private fun showLoading() = binding.syncProgressBar.visible()

  private fun hideLoading() = binding.syncProgressBar.gone()

  private fun loadProfilePic() {
    binding.appTb.showProfilePicture()

    lifecycleScope.launchWhenStarted {
      withContext(Dispatchers.IO) {
        val profilePicPath =
            authManager.fetchLoggedInWorker().profilePicturePath ?: return@withContext
        val bitmap = BitmapFactory.decodeFile(profilePicPath)

        withContext(Dispatchers.Main.immediate) { binding.appTb.setProfilePicture(bitmap) }
      }
    }
  }

  fun onDashboardItemClick(task: TaskInfo) {
    //    val nextIntent =
    if (!task.isGradeCard && task.taskStatus.assignedMicrotasks > 0) {
      when (task.scenarioName) {
        // TODO: CONVERT TO TODO
        // Use [ScenarioType] enum once we migrate to it.
        "SPEECH_DATA" -> {
          val action = DashboardFragmentDirections.actionDashboardActivityToSpeechDataMainFragment2(task.taskID)
          findNavController().navigate(action)
        }
        "XLITERATION_DATA" -> {
          val action = DashboardFragmentDirections.actionDashboardActivityToSignVideoMainFragment(task.taskID)
          findNavController().navigate(action)
        }
        "MV_XLITERATION_VERIFICATION" -> {
          val action =
              DashboardFragmentDirections.actionDashboardActivityToUniversalTransliterationMainFragment(task.taskID)
          findNavController().navigate(action)
        }
        "SIGN_LANGUAGE_VIDEO" -> {
          val action = DashboardFragmentDirections.actionDashboardActivityToSignVideoMainFragment(task.taskID)
          findNavController().navigate(action)
        }
        "SGN_LANG_VIDEO_VERIFICATION" -> {
          val action = DashboardFragmentDirections.actionDashboardActivityToSignVideoVerificationFragment(task.taskID)
          findNavController().navigate(action)
        }
      }
    } else if (!task.isGradeCard && task.taskStatus.completedMicrotasks > 0) {
      when (task.scenarioName) {
        "SIGN_LANGUAGE_VIDEO" -> {
          val action = DashboardFragmentDirections.actionDashboardActivityToSignVideoMainFragment(task.taskID)
          findNavController().navigate(action)
        }
      }
    } else if (task.isGradeCard) {
      when (task.scenarioName) {
        "SIGN_LANGUAGE_VIDEO" -> {
          val action = DashboardFragmentDirections.actionDashboardActivityToSignVideoFeedbackFragment(task.taskID)
          findNavController().navigate(action)
        }
      }
    }
  }
}
