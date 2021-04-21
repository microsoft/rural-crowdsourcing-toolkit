package com.microsoft.research.karya.ui.dashboard

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.ActivityDashboardBinding
import com.microsoft.research.karya.ui.scenarios.speechData.SpeechDataMain
import com.microsoft.research.karya.ui.scenarios.speechVerification.SpeechVerificationMain
import com.microsoft.research.karya.ui.scenarios.storySpeech.StorySpeechMain
import com.microsoft.research.karya.utils.viewBinding

class NgDashboardActivity : AppCompatActivity() {

  val binding by viewBinding(ActivityDashboardBinding::inflate)
  val viewModel: DashboardViewModel by viewModels()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(binding.root)
  }

  fun setupViews() {
    with(binding) {
      // TODO: Convert this to one string instead of joining multiple strings
      val syncText =
          "${getString(R.string.s_get_new_tasks)} - " +
              "${getString(R.string.s_submit_completed_tasks)} - " +
              "${getString(R.string.s_update_verified_tasks)} - " +
              getString(R.string.s_update_earning)

      syncPromptTv.text = syncText
    }
  }

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

        startActivity(nextIntent)
    */

    // task.scenarioID for now
    val nextIntent =
        when (task.scenarioName) {
          // Use [ScenarioType] enum once we migrate to it.
          "story-speech" -> Intent(this, StorySpeechMain::class.java)
          "speech-data" -> Intent(this, SpeechDataMain::class.java)
          "speech-verification" -> Intent(this, SpeechVerificationMain::class.java)
          else -> error("Unimplemented scenario")
        }

    nextIntent.putExtra("taskID", task.taskID)
    nextIntent.putExtra("incomplete", task.incompleteMicrotasks)
    nextIntent.putExtra("completed", task.completedMicrotasks)

    startActivity(nextIntent)
  }

  fun syncBox() {
    // TODO: Make app language an enum
    viewModel.syncTasks(this, -1)
  }
}
