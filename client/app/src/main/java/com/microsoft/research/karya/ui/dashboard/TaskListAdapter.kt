package com.microsoft.research.karya.ui.dashboard

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.ItemDashboardCardBinding

class TaskListAdapter(
  private var tasks: List<TaskInfo>,
  private val dashboardItemClick: (task: TaskInfo) -> Unit = {},
) : RecyclerView.Adapter<TaskListAdapter.NgTaskViewHolder>() {

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NgTaskViewHolder {
    val layoutInflater = LayoutInflater.from(parent.context)
    val binding = ItemDashboardCardBinding.inflate(layoutInflater, parent, false)

    return NgTaskViewHolder(binding, dashboardItemClick)
  }

  override fun onBindViewHolder(holder: NgTaskViewHolder, position: Int) {
    holder.bind(tasks[position])
  }

  override fun getItemCount(): Int {
    return tasks.size
  }

  fun addTasks(newTasks: List<TaskInfo>) {
    val oldTaskCount = tasks.size
    val tempList = mutableListOf<TaskInfo>()
    tempList.addAll(tasks)
    tempList.addAll(newTasks)

    tasks = tempList
    notifyItemRangeInserted(oldTaskCount, newTasks.size)
  }

  fun updateList(newList: List<TaskInfo>) {
    tasks = newList
    notifyDataSetChanged()
  }

  class NgTaskViewHolder(
    private val binding: ItemDashboardCardBinding,
    private val dashboardItemClick: (task: TaskInfo) -> Unit,
  ) : RecyclerView.ViewHolder(binding.root) {

    fun bind(taskInfo: TaskInfo) {
      setText(binding, taskInfo)
      setViews(binding, taskInfo)
    }

    private fun setText(binding: ItemDashboardCardBinding, task: TaskInfo) {
      with(binding) {
        task.apply {
          val context = binding.root.context
          val total =
            taskStatus.assignedMicrotasks +
              taskStatus.completedMicrotasks +
              taskStatus.submittedMicrotasks +
              taskStatus.verifiedMicrotasks

          val available = taskStatus.assignedMicrotasks
          val completed =
            taskStatus.completedMicrotasks + taskStatus.submittedMicrotasks + taskStatus.verifiedMicrotasks
          val submitted = taskStatus.submittedMicrotasks + taskStatus.verifiedMicrotasks
          val verified = taskStatus.verifiedMicrotasks

          taskTitle.text = taskName
          taskSubtitle.text = context.getString(R.string.d_sentences_available, total)
          tasksAvailable.text = context.getString(R.string.d_tasks_available, available, total)
          tasksCompleted.text = context.getString(R.string.d_tasks_completed, completed, total)
          tasksSubmitted.text = context.getString(R.string.d_tasks_submitted, submitted, total)
          tasksVerified.text = context.getString(R.string.d_tasks_verified, verified, total)
        }
      }
    }

    private fun setViews(binding: ItemDashboardCardBinding, task: TaskInfo) {
      with(binding) {
        task.apply {
          root.apply {
            val clickableAndEnabled = task.taskStatus.assignedMicrotasks > 0
            isClickable = clickableAndEnabled
            isEnabled = clickableAndEnabled

            setOnClickListener {
              isClickable = false
              isEnabled = false
              dashboardItemClick(task)
            }
          }

          val drawable =
            when (task.scenarioName) {
              "SPEECH_DATA" -> ContextCompat.getDrawable(root.context, R.drawable.ic_task_speech_data)
              "SPEECH_VERIFICATION" -> ContextCompat.getDrawable(root.context, R.drawable.ic_task_speech_data)
              "TEXT_TRANSLATION" -> ContextCompat.getDrawable(root.context, R.drawable.ic_task_text_data)
              else -> ContextCompat.getDrawable(root.context, R.drawable.ic_task_speech_data)
            }
          taskImage.setImageDrawable(drawable)
        }
      }
    }
  }
}
