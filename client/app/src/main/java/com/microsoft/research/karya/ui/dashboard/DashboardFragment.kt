package com.microsoft.research.karya.ui.dashboard

import android.app.AlertDialog
import android.graphics.BitmapFactory
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.viewModels
import androidx.lifecycle.Observer
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.work.*
import com.microsoft.research.karya.BuildConfig
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.enums.ScenarioType
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.FragmentDashboardBinding
import com.microsoft.research.karya.ui.base.SessionFragment
import com.microsoft.research.karya.utils.extensions.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*

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
  val viewModel: DashboardViewModel by viewModels()
  private lateinit var syncWorkRequest: OneTimeWorkRequest

  private var dialog: AlertDialog? = null

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
        is DashboardUiState.Error -> showErrorUi(
          dashboardUiState.throwable,
          ERROR_TYPE.TASK_ERROR,
          ERROR_LVL.ERROR
        )
        DashboardUiState.Loading -> showLoadingUi()
      }
    }

    viewModel.workerAccessCode.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { code ->
      binding.accessCodeTv.text = code
    }

    // Work for center user
    viewModel.workFromCenterUser.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { wfc ->
      if (wfc) {
        if (!viewModel.userInCenter.value) {
          binding.wfcEnterCodeLL.visible()
          binding.revokeWFCAuthorizationBtn.gone()
        } else {
          binding.wfcEnterCodeLL.gone()
          binding.revokeWFCAuthorizationBtn.visible()
        }
      }
    }

    viewModel.userInCenter.observe(viewLifecycleOwner.lifecycle, lifecycleScope) { uIC ->
      if (viewModel.workFromCenterUser.value) {
        if (!uIC) {
          binding.wfcEnterCodeLL.visible()
          binding.revokeWFCAuthorizationBtn.gone()
        } else {
          binding.wfcEnterCodeLL.gone()
          binding.revokeWFCAuthorizationBtn.visible()
        }
      }
    }

    viewModel.progress.observe(lifecycle, lifecycleScope) { i ->
      binding.syncProgressBar.progress = i
    viewModel.progress.observe(lifecycle, lifecycleScope) { i -> binding.syncProgressBar.progress = i }

    viewModel.navigationFlow.observe(viewLifecycle, viewLifecycleScope) { navigation ->
      val resId =
        when (navigation) {
          DashboardNavigation.PAYMENT_REGISTRATION -> R.id.action_dashboardActivity_to_paymentRegistrationFragment
          DashboardNavigation.PAYMENT_VERIFICATION -> R.id.action_dashboardActivity_to_paymentVerificationFragment
          DashboardNavigation.PAYMENT_DASHBOARD -> R.id.action_dashboardActivity_to_paymentDashboardFragment
          DashboardNavigation.PAYMENT_FAILURE -> R.id.action_global_paymentFailureFragment
        }

      findNavController().navigate(resId)
    }

    WorkManager.getInstance(requireContext())
      .getWorkInfosForUniqueWorkLiveData(UNIQUE_SYNC_WORK_NAME)
      .observe(viewLifecycleOwner) { workInfos ->
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
          // refresh the UI to show microtasks
          if (progress == 100)
            viewLifecycleScope.launch {
              viewModel.refreshList()
            }
        }
        if (workInfo != null && workInfo.state == WorkInfo.State.FAILED) {
          lifecycleScope.launch {
            showErrorUi(
              Throwable(workInfo.outputData.getString("errorMsg")),
              ERROR_TYPE.SYNC_ERROR,
              ERROR_LVL.ERROR
            )
            viewModel.refreshList()
          }
        }
      }
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

      binding.submitCenterCodeBtn.setOnClickListener {
        viewModel.authorizeWorkFromCenterUser(binding.centerCode.text.toString())
        binding.centerCode.text.clear()
      }

      binding.revokeWFCAuthorizationBtn.setOnClickListener {
        viewModel.revokeWFCAuthorization()
        binding.centerCode.text.clear()
      }

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
      if (workerBalance > 0.0f) {
        binding.rupeesEarnedCl.visible()
        binding.rupeesEarnedTv.text = "%.2f".format(Locale.ENGLISH, workerBalance)
        if (workerBalance > 2.0f) {
          binding.rupeesEarnedCl.setOnClickListener { viewModel.navigatePayment() }
        } else {
          binding.rupeesEarnedCl.setOnClickListener {
            Toast.makeText(requireContext(), "Please earn at least Rs 2", Toast.LENGTH_LONG).show()
          }
        }
      } else {
        binding.rupeesEarnedCl.gone()
      }
    }

    // Show a dialog box to sync with server if completed tasks and internet available
    if (requireContext().isNetworkAvailable()) {
      for (taskInfo in data.taskInfoData) {
        if (taskInfo.taskStatus.completedMicrotasks > 0) {
          showDialogueToSync()
          return
        }
      }
    }
  }

  private fun showDialogueToSync() {

    if (dialog != null && dialog!!.isShowing) return

    val builder: AlertDialog.Builder? = activity?.let {
      AlertDialog.Builder(it)
    }

    builder?.setMessage(R.string.sync_prompt_message)

    // Set buttons
    builder?.apply {
      setPositiveButton(
        R.string.yes
      ) { _, _ ->
        syncWithServer()
        dialog!!.dismiss()
      }
      setNegativeButton(R.string.no, null)
    }

    dialog = builder?.create()
    dialog!!.show()
  }

  private fun showErrorUi(throwable: Throwable, errorType: ERROR_TYPE, errorLvl: ERROR_LVL) {
    hideLoading()
    showError(throwable.message ?: "Some error Occurred", errorType, errorLvl)
    binding.syncCv.enable()
  }

  private fun showError(message: String, errorType: ERROR_TYPE, errorLvl: ERROR_LVL) {
    if (errorType == ERROR_TYPE.SYNC_ERROR) {
      WorkManager.getInstance(requireContext()).cancelAllWork()
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
          authManager.getLoggedInWorker().profilePicturePath ?: return@withContext
        val bitmap = BitmapFactory.decodeFile(profilePicPath)

        withContext(Dispatchers.Main.immediate) { binding.appTb.setProfilePicture(bitmap) }
      }
    }
  }

  fun onDashboardItemClick(task: TaskInfo) {
    if (!task.isGradeCard && (task.taskStatus.assignedMicrotasks + task.taskStatus.skippedMicrotasks) > 0) {
      val taskId = task.taskID
      val status = task.taskStatus
      val completed =
        status.completedMicrotasks + status.submittedMicrotasks + status.verifiedMicrotasks
      val total = status.assignedMicrotasks + completed
      var action = with(DashboardFragmentDirections) {
        when (task.scenarioName) {
          ScenarioType.SPEECH_DATA -> actionDashboardActivityToSpeechDataMainFragment(
            taskId,
            completed,
            total
          )
          ScenarioType.XLITERATION_DATA -> actionDashboardActivityToUniversalTransliterationMainFragment(
            taskId,
            completed,
            total
          )
          ScenarioType.SPEECH_VERIFICATION -> actionDashboardActivityToSpeechVerificationFragment(
            taskId,
            completed,
            total
          )
          ScenarioType.IMAGE_TRANSCRIPTION -> actionDashboardActivityToImageTranscription(
            taskId,
            completed,
            total
          )
          ScenarioType.IMAGE_LABELLING -> actionDashboardActivityToImageLabelling(
            taskId,
            completed,
            total
          )
          ScenarioType.IMAGE_ANNOTATION -> actionDashboardActivityToImageAnnotationFragment(
            taskId,
            completed,
            total
          )
          ScenarioType.QUIZ -> actionDashboardActivityToQuiz(taskId, completed, total)
          ScenarioType.IMAGE_DATA -> actionDashboardActivityToImageData(taskId, completed, total)
          ScenarioType.SENTENCE_VALIDATION -> actionDashboardActivityToSentenceValidation(
            taskId,
            completed,
            total
          )
          ScenarioType.SPEECH_TRANSCRIPTION -> actionDashboardActivityToSpeechTranscriptionFragment(
            taskId,
            completed,
            total
          )
          ScenarioType.SENTENCE_CORPUS -> actionDashboardActivityToSentenceCorpusFragment(
            taskId,
            completed,
            total
          )
          else -> null
        }
      }
      if (action == null && BuildConfig.FLAVOR == "large") {
        action = when (task.scenarioName) {
          ScenarioType.SIGN_LANGUAGE_VIDEO -> DashboardFragmentDirections.actionDashboardActivityToSignVideo(
            taskId,
            completed,
            total
          )
          ScenarioType.SGN_LANG_VIDEO_VERIFICATION -> DashboardFragmentDirections.actionDashboardActivityToSignVideoVerification(
            taskId,
            completed,
            total
          )
          else -> null
        }
      }
      if (action != null) {
        // Check if user is in center
        if (viewModel.workFromCenterUser.value) {
          viewModel.checkWorkFromCenterUserAuth()
          if (!viewModel.userInCenter.value) {
            binding.centerCode.requestFocus()
            return
          }
        }

        if (task.taskInstruction == null) {
          findNavController().navigate(action)
        } else {
          val builder = AlertDialog.Builder(requireContext())
          val message = task.taskInstruction
          builder.setMessage(message)
          builder.setNeutralButton(R.string.okay) { _, _ ->
            findNavController().navigate(action)
          }
          val dialog = builder.create()
          dialog.show()
        }
      }
    }
  }
}
