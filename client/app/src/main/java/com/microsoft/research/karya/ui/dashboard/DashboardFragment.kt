package com.microsoft.research.karya.ui.dashboard

import android.graphics.BitmapFactory
import android.os.Bundle
import android.view.View
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.manager.AuthManager
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.FragmentDashboardBinding
import com.microsoft.research.karya.utils.PreferenceKeys
import com.microsoft.research.karya.utils.extensions.dataStore
import com.microsoft.research.karya.utils.extensions.disable
import com.microsoft.research.karya.utils.extensions.enable
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.observe
import com.microsoft.research.karya.utils.extensions.viewBinding
import com.microsoft.research.karya.utils.extensions.visible
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.android.synthetic.main.fragment_dashboard.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@AndroidEntryPoint
class DashboardFragment : Fragment(R.layout.fragment_dashboard) {

  val binding by viewBinding(FragmentDashboardBinding::bind)
  val viewModel: DashboardViewModel by viewModels()

  @Inject lateinit var authManager: AuthManager

  override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    setupViews()
    observeUi()
    fetchTasksOnFirstRun()
  }

  override fun onResume() {
    super.onResume()
    viewModel.getAllTasks() // TODO: Remove onResume and get taskId from scenario viewmodel (similar to onActivity Result)
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
      appTb.setProfileClickListener { findNavController().navigate(R.id.action_global_tempDataFlow) }
      loadProfilePic()
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

  private fun showSuccessUi(data: DashboardStateSuccess) {
    hideLoading()
    syncCv.enable()
    data.apply {
      (binding.tasksRv.adapter as TaskListAdapter).updateList(taskInfoData)
      // Show total credits if it is greater than 0
      if (totalCreditsEarned > 0.0f) {
        binding.rupeesEarnedCl.visible()
        binding.rupeesEarnedTv.text = "%.2f".format(totalCreditsEarned)
      } else {
        binding.rupeesEarnedCl.gone()
      }
    }
  }

  private fun showErrorUi(throwable: Throwable) {
    hideLoading()
    syncCv.enable()
  }

  private fun showLoadingUi() {
    showLoading()
    syncCv.disable()
  }

  private fun showLoading() = binding.syncProgressBar.visible()

  private fun hideLoading() = binding.syncProgressBar.gone()

  private fun loadProfilePic() {
    binding.appTb.showProfilePicture()

    lifecycleScope.launchWhenStarted {
      withContext(Dispatchers.IO) {
        val profilePicPath = authManager.fetchLoggedInWorker().profilePicturePath ?: return@withContext
        val bitmap = BitmapFactory.decodeFile(profilePicPath)

        withContext(Dispatchers.Main.immediate) { binding.appTb.setProfilePicture(bitmap) }
      }
    }
  }

  fun onDashboardItemClick(task: TaskInfo) {
    //    val nextIntent =
    when (task.scenarioName) {
      // TODO: CONVERT TO TODO
      // Use [ScenarioType] enum once we migrate to it.
      "SPEECH_DATA" -> {
        val action = DashboardFragmentDirections.actionDashboardActivityToSpeechDataMainFragment2(task.taskID)
        findNavController().navigate(action)
      }
      "MV_XLITERATION" -> {
        val action = DashboardFragmentDirections.actionDashboardActivityToTransliterationVerificationFragment(task.taskID)
        findNavController().navigate(action)
      }
    }
  }

  private fun fetchTasksOnFirstRun() {
    val firstFetchKey = booleanPreferencesKey(PreferenceKeys.IS_FIRST_FETCH)

    lifecycleScope.launchWhenStarted {
      this@DashboardFragment.requireContext().dataStore.edit { prefs ->
        val isFirstFetch = prefs[firstFetchKey] ?: true

        if (isFirstFetch) {
          viewModel.syncWithServer()
        }

        prefs[firstFetchKey] = false
      }
    }
  }
}
