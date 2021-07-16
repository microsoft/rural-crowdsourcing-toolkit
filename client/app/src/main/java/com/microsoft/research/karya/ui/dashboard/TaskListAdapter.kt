package com.microsoft.research.karya.ui.dashboard

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.data.model.karya.modelsExtra.TaskInfo
import com.microsoft.research.karya.databinding.ItemTaskBinding
import com.microsoft.research.karya.utils.extensions.gone
import com.microsoft.research.karya.utils.extensions.visible

class TaskListAdapter(
  private var tasks: List<TaskInfo>,
  private val dashboardItemClick: (task: TaskInfo) -> Unit = {},
) : RecyclerView.Adapter<TaskListAdapter.NgTaskViewHolder>() {

  override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NgTaskViewHolder {
    val layoutInflater = LayoutInflater.from(parent.context)
    val binding = ItemTaskBinding.inflate(layoutInflater, parent, false)

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
    private val binding: ItemTaskBinding,
    private val dashboardItemClick: (task: TaskInfo) -> Unit,
  ) : RecyclerView.ViewHolder(binding.root) {

    fun bind(taskInfo: TaskInfo) {
      setText(binding, taskInfo)
      setViews(binding, taskInfo)
    }

    private fun setText(binding: ItemTaskBinding, task: TaskInfo) {
      with(binding) {
        task.apply {
          taskNameTv.text = taskName
          scenarioNameTv.text = scenarioName
          numIncompleteTv.text = taskStatus.assignedMicrotasks.toString()
          numCompletedTv.text = taskStatus.completedMicrotasks.toString()
          numSkippedTv.text = taskStatus.skippedMicrotasks.toString()
          numSubmittedTv.text = taskStatus.submittedMicrotasks.toString()
          numVerifiedTv.text = taskStatus.verifiedMicrotasks.toString()
        }
      }
    }

    private fun setViews(binding: ItemTaskBinding, task: TaskInfo) {
      with(binding) {
        task.apply {
          completedTasksPb.max = taskStatus.assignedMicrotasks + taskStatus.completedMicrotasks + taskStatus.skippedMicrotasks
          completedTasksPb.progress = taskStatus.completedMicrotasks + taskStatus.skippedMicrotasks

          incompleteCl.apply { if (taskStatus.assignedMicrotasks > 0) visible() else gone() }
          completedCl.apply { if (taskStatus.completedMicrotasks > 0) visible() else gone() }
          skippedCl.apply { if (taskStatus.skippedMicrotasks > 0) visible() else gone() }
          submittedCl.apply { if (taskStatus.submittedMicrotasks > 0) visible() else gone() }
          verifiedCl.apply { if (taskStatus.verifiedMicrotasks > 0) visible() else gone() }
        }

        taskLl.apply {
          val clickableAndEnabled = task.taskStatus.assignedMicrotasks > 0
          isClickable = clickableAndEnabled
          isEnabled = clickableAndEnabled

          setOnClickListener {
            isClickable = false
            isEnabled = false
            dashboardItemClick(task)
          }
        }
      }
    }
  }
}