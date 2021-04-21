// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

package com.microsoft.research.karya.dashboard

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.constraintlayout.widget.ConstraintLayout
import androidx.recyclerview.widget.RecyclerView
import com.microsoft.research.karya.R
import com.microsoft.research.karya.database.modelsExtra.TaskInfo
import kotlinx.android.synthetic.main.item_task.view.*

class TaskListAdapter(
    val context: Context,
    private val onDashboardTaskAdapterClick: OnDashboardTaskAdapterClick,
    val activity: DashboardActivity
) : RecyclerView.Adapter<TaskViewHolder>() {

  private var tasks: List<TaskInfo> = mutableListOf()
  private var incompleteMicrotasksLabel: String = ""
  private var completedMicrotasksLabel: String = ""
  private var submittedMicrotasksLabel: String = ""
  private var verifiedMicrotasksLabel: String = ""

  override fun onCreateViewHolder(p0: ViewGroup, p1: Int): TaskViewHolder {
    return TaskViewHolder(LayoutInflater.from(context).inflate(R.layout.item_task, p0, false))
  }

  override fun getItemCount(): Int {
    return tasks.size
  }

  override fun onBindViewHolder(p0: TaskViewHolder, p1: Int) {
    val task = tasks[p1]
    p0.taskName.text = task.taskName
    p0.scenarioName.text = task.scenarioName

    p0.progressBar.max = task.incompleteMicrotasks + task.completedMicrotasks
    p0.progressBar.progress = task.completedMicrotasks

    p0.incompleteCl.visibility = if (task.incompleteMicrotasks > 0) View.VISIBLE else View.GONE
    p0.completedCl.visibility = if (task.completedMicrotasks > 0) View.VISIBLE else View.GONE
    p0.submittedCl.visibility = if (task.submittedMicrotasks > 0) View.VISIBLE else View.GONE
    p0.verifiedCl.visibility = if (task.verifiedMicrotasks > 0) View.VISIBLE else View.GONE

    p0.numIncompleteLabel.text = incompleteMicrotasksLabel
    p0.numCompletedLabel.text = completedMicrotasksLabel
    p0.numSubmittedLabel.text = submittedMicrotasksLabel
    p0.numVerifiedLabel.text = verifiedMicrotasksLabel

    p0.numIncompleteTv.text = task.incompleteMicrotasks.toString()
    p0.numCompletedTv.text = task.completedMicrotasks.toString()
    p0.numSubmittedTv.text = task.submittedMicrotasks.toString()
    p0.numVerifiedTv.text = task.verifiedMicrotasks.toString()

    if (task.incompleteMicrotasks == 0) {
      p0.taskLl.isClickable = false
      p0.taskLl.isEnabled = false
    } else {
      p0.taskLl.isClickable = true
      p0.taskLl.isEnabled = true
    }

    p0.taskLl.setOnClickListener {
      p0.taskLl.isClickable = false
      p0.taskLl.isEnabled = false
      onDashboardTaskAdapterClick.onclickDashboardTaskItem(task)
    }
  }

  fun setLabels(
      incompleteLabel: String,
      completedLabel: String,
      submittedLabel: String,
      verifiedLabel: String
  ) {
    incompleteMicrotasksLabel = incompleteLabel
    completedMicrotasksLabel = completedLabel
    submittedMicrotasksLabel = submittedLabel
    verifiedMicrotasksLabel = verifiedLabel
  }

  fun setList(tasks: List<TaskInfo>) {
    this.tasks = tasks
    notifyDataSetChanged()
  }
}

class TaskViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
  val taskLl: LinearLayout = itemView.taskLl
  val taskName: TextView = itemView.taskNameTv
  val scenarioName: TextView = itemView.scenarioNameTv
  val progressBar: ProgressBar = itemView.completedTasksPb

  val numIncompleteTv: TextView = itemView.numIncompleteTv
  val numCompletedTv: TextView = itemView.numCompletedTv
  val numSubmittedTv: TextView = itemView.numSubmittedTv
  val numVerifiedTv: TextView = itemView.numVerifiedTv

  val numIncompleteLabel: TextView = itemView.numIncompleteLabel
  val numCompletedLabel: TextView = itemView.numCompletedLabel
  val numSubmittedLabel: TextView = itemView.numSubmittedLabel
  val numVerifiedLabel: TextView = itemView.numVerifiedLabel

  val incompleteCl: ConstraintLayout = itemView.incompleteCl
  val completedCl: ConstraintLayout = itemView.completedCl
  val submittedCl: ConstraintLayout = itemView.submittedCl
  val verifiedCl: ConstraintLayout = itemView.verifiedCl
}
