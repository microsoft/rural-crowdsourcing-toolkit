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
          numIncompleteTv.text = taskStatus.assignedMicrotasks.toString()
          numCompletedTv.text = taskStatus.completedMicrotasks.toString()
          numSubmittedTv.text = taskStatus.submittedMicrotasks.toString()
          numVerifiedTv.text = taskStatus.verifiedMicrotasks.toString()
        }
      }
    }

    private fun setViews(binding: ItemTaskBinding, task: TaskInfo) {
      with(binding) {
        task.apply {
          val microtasksTotal =
            taskStatus.assignedMicrotasks +
              taskStatus.completedMicrotasks +
              taskStatus.skippedMicrotasks +
              taskStatus.submittedMicrotasks +
              taskStatus.verifiedMicrotasks
          val microtasksProgress = microtasksTotal - taskStatus.assignedMicrotasks
          completedTasksPb.max = microtasksTotal
          completedTasksPb.progress = microtasksProgress

          if (task.isGradeCard) {
            completedTasksPb.gone()
          } else {
            completedTasksPb.visible()
          }
        }

        taskLl.apply {
          val status = task.taskStatus
          val clickableAndEnabled =
            (!task.isGradeCard && (status.assignedMicrotasks + status.completedMicrotasks) > 0) || (task.isGradeCard && status.verifiedMicrotasks > 0)
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
