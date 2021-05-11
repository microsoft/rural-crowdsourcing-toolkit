package com.microsoft.research.karya.ui.dashboard

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.FragmentDashboardBinding
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMain
import com.microsoft.research.karya.ui.scenarios.speechVerification.SpeechVerificationMain
import com.microsoft.research.karya.ui.scenarios.storySpeech.StorySpeechMain
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class DashboardFragment : Fragment(R.layout.fragment_dashboard) {

  val binding by viewBinding(FragmentDashboardBinding::bind)
  val viewModel: DashboardViewModel by viewModels()

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()

    viewModel.getAllTasks()
  }

  private fun setupViews() {
    with(binding) {
      // TODO: Convert this to one string instead of joining multiple strings
      val syncText =
        "${getString(R.string.s_get_new_tasks)} - " +
          "${getString(R.string.s_submit_completed_tasks)} - " +
          "${getString(R.string.s_update_verified_tasks)} - " +
          getString(R.string.s_update_earning)

      syncPromptTv.text = syncText

      tasksRv.apply {
        adapter = TaskListAdapter(emptyList(), ::onDashboardItemClick)
        layoutManager = LinearLayoutManager(context)
      }

      syncCv.setOnClickListener { viewModel.syncWithServer() }

      appTb.setTitle(getString(R.string.s_dashboard_title))
    }
  }

  private fun observeUi() {
    viewModel.dashboardUiState.observe(lifecycle, lifecycleScope) { dashboardUiState ->
      when (dashboardUiState) {
        is DashboardUiState.Success -> showSuccessUi(dashboardUiState.data)
        is DashboardUiState.Error -> showErrorUi(dashboardUiState.throwable)
        DashboardUiState.Loading -> showLoadingUi()
      }
    }
  }

  private fun showSuccessUi(taskInfoList: List<TaskInfo>) {
    hideLoading()
    (binding.tasksRv.adapter as TaskListAdapter).updateList(taskInfoList)
  }

  private fun showErrorUi(throwable: Throwable) {
    hideLoading()
  }

  private fun showLoadingUi() {
    showLoading()
  }

  private fun showLoading() = binding.syncProgressBar.visible()

  private fun hideLoading() = binding.syncProgressBar.gone()

  fun onDashboardItemClick(task: TaskInfo) {
    /*
          var taskRecord: TaskRecord?
          var scenarioRecord: ScenarioRecord? = null

          runBlocking {
              ioScope.launch {
                  taskRecord = karyaDb.taskDao().getById(task.taskID)
                  scenarioRecord = karyaDb.scenarioDao().getById(taskRecord!!.scenario_id)
              }.join()
          }

          val nextIntent = when (scenarioRecord?.name) {
              "story-speech" -> Intent(this, StorySpeechMain::class.java)
              "speech-data" -> Intent(this, SpeechDataMain::class.java)
              "speech-verification" -> Intent(this, SpeechVerificationMain::class.java)
              else -> {
                  throw Exception("Unimplemented scenario")
              }
          }

          nextIntent.putExtra("taskID", task.taskID)
          nextIntent.putExtra("incomplete", task.incompleteMicrotasks)
          nextIntent.putExtra("completed", task.completedMicrotasks)

      runBlocking {
          ioScope.launch {
              taskRecord = karyaDb.taskDao().getById(task.taskID)
              scenarioRecord = karyaDb.scenarioDao().getById(taskRecord!!.scenario_id)
          }.join()
      }

      // task.scenarioID for now
      val nextIntent = when (task.scenarioName) {
          // Use [ScenarioType] enum once we migrate to it.
          "story-speech" -> Intent(this, StorySpeechMain::class.java)
          "speech-data" -> Intent(this, SpeechDataMain::class.java)
          "speech-verification" -> Intent(this, SpeechVerificationMain::class.java)
          else -> {
              throw Exception("Unimplemented scenario")
          }
      }

      nextIntent.putExtra("taskID", task.taskID)
      nextIntent.putExtra("incomplete", task.incompleteMicrotasks)
      nextIntent.putExtra("completed", task.completedMicrotasks)

      startActivity(nextIntent)
    */

    val nextIntent =
      when ("speech-data") {
        // TODO: MAKE THIS GENERAL ONCE API RESPONSE UPDATES
        // Use [ScenarioType] enum once we migrate to it.
        "story-speech" -> Intent(requireContext(), StorySpeechMain::class.java)
        "speech-data" -> Intent(requireContext(), SpeechDataMain::class.java)
        "speech-verification" -> Intent(requireContext(), SpeechVerificationMain::class.java)
        else -> {
          throw Exception("Unimplemented scenario")
        }
      }

    nextIntent.putExtra("taskID", task.taskID)

    startActivity(nextIntent)
  }
}
