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
      val status = taskInfo.taskStatus
      val verified = status.verifiedMicrotasks
      val submitted = status.submittedMicrotasks + verified
      val completed = status.completedMicrotasks + submitted
      val assigned = status.assignedMicrotasks
      val skipped = status.skippedMicrotasks
      val expired = status.expiredMicrotasks

      val clickable = (assigned + skipped) > 0

      with(binding) {
        // Set text
        taskNameTv.text = taskInfo.taskName
        numIncompleteTv.text = assigned.toString()
        numCompletedTv.text = completed.toString()
        numSubmittedTv.text = submitted.toString()
        numVerifiedTv.text = verified.toString()
        numSkippedTv.text = skipped.toString()
        numExpiredTv.text = expired.toString()

        // Set views
        completedTasksPb.max = assigned + completed
        completedTasksPb.progress = completed

        // Task click listener
        taskLl.setOnClickListener { dashboardItemClick(taskInfo) }
        taskLl.isClickable = clickable
        taskLl.isEnabled = clickable
      }
    }
  }
}
