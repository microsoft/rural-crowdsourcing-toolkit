// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import BBPromise from 'bluebird';
import {
  AssignmentOrder,
  MicrotaskAssignmentRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  WorkerRecord,
  PolicyName,
  TaskRecord,
  TaskRecordType,
  ScenarioName,
  TaskAssignmentRecord,
} from '@karya/core';
import { BasicModel, MicrotaskModel, MicrotaskGroupModel, karyaLogger, WorkerModel } from '@karya/common';
import { localPolicyMap } from './policies/Index';

// Create an assignment logger
const assignmentLogger = karyaLogger({ name: 'assignments' });

// Current assignment map for workers
const assigning: { [id: string]: boolean } = {};

// max week ID
const MAX_WEEK_ID = 5;

/**
 * Assign microtask/microtaskgroup depending on the task to a worker and returns the assignments
 * @param worker worker to whom assignments will be assigned
 * @param maxCredits max amount of credits of tasks that will assigned to the user
 */
export async function assignMicrotasksForWorker(worker: WorkerRecord, maxCredits: number): Promise<void> {
  assignmentLogger.info({ worker_id: worker.id, message: 'Entering assignment' });

  // Check if we are currently assigning anything to these workers
  if (assigning[worker.id]) {
    assignmentLogger.info({ worker_id: worker.id, message: 'Already assigning' });
    return;
  }
  assigning[worker.id] = true;

  try {
    // If worker is disabled, return
    if (WorkerModel.isDisabled(worker)) {
      assigning[worker.id] = false;
      assignmentLogger.info({ worker_id: worker.id, message: 'Worker disabled' });
      return;
    }

    // Determine worker week
    const regTime = new Date(worker.registered_at).getTime();
    const currentTime = Date.now();
    const diffMilli = currentTime - regTime;
    const diffWeeks = Math.floor(diffMilli / 1000 / 3600 / 24 / 7);
    const weekId = diffWeeks + 1 > MAX_WEEK_ID ? MAX_WEEK_ID : diffWeeks + 1;
    const weekTag = `week${weekId}`;
    worker.tags.tags.push(weekTag);

    assignmentLogger.info({ worker_id: worker.id, tags: worker.tags });

    // Check if the worker has incomplete assignments. If so, return
    const hasCurrentAssignments = await MicrotaskModel.hasIncompleteMicrotasks(worker.id);
    if (hasCurrentAssignments) {
      assigning[worker.id] = false;
      assignmentLogger.info({ worker_id: worker.id, message: 'Worker has assignments' });
      return;
    }

    let availableCredits = maxCredits;
    let tasksAssigned = false;

    // get all available tasks i.e. all of which are in assigned state
    const taskAssignments = await BasicModel.getRecords(
      'task_assignment',
      {
        box_id: worker.box_id,
        status: 'ASSIGNED',
      },
      [],
      [],
      'task_id'
    );

    assignmentLogger.info({ worker_id: worker.id, message: 'Entering assignment loop' });
    // iterate over all tasks to see which all can user perform
    await BBPromise.mapSeries(taskAssignments, async (taskAssignment) => {
      // Get task for the assignment
      const task = (await BasicModel.getSingle('task', { id: taskAssignment.task_id })) as TaskRecordType;
      if (task.status == 'COMPLETED') return;

      // check if the task is assignable to the worker
      if (!assignable(task, taskAssignment, worker)) return;

      const policy_name = taskAssignment.policy;
      const policy = localPolicyMap[policy_name];

      const chosenMicrotaskGroups: MicrotaskGroupRecord[] = [];
      let chosenMicrotasks: MicrotaskRecord[] = [];

      // TODO: Hack
      const batchSize = task.assignment_batch_size ?? 1000;

      if (task.assignment_granularity === 'GROUP') {
        // Get all assignable microtask groups
        let assignableGroups = await policy.assignableMicrotaskGroups(worker, task, taskAssignment.params);

        const microtaskLimit = (taskAssignment.params.maxMicrotasksPerUser as number) || 0;
        let assignLimit = 10;
        let assignedCount = -1;
        if (microtaskLimit > 0) {
          assignedCount = await MicrotaskGroupModel.getAssignedCount(worker.id, task.id);
          assignLimit = microtaskLimit - assignedCount;
          if (assignLimit < 0) assignLimit = 0;
        }

        // Reorder the groups based on assignment order
        reorder(assignableGroups, task.group_assignment_order);

        assignLimit = assignLimit < batchSize ? assignLimit : batchSize;
        assignableGroups = assignableGroups.slice(0, assignLimit);

        // Identify the prefix that fits within max credits
        for (const group of assignableGroups) {
          // Get total credits for the group
          const credits = await MicrotaskGroupModel.getTotalCredits(group);
          if (availableCredits - credits > 0) {
            chosenMicrotaskGroups.push(group);
            availableCredits -= credits;
          } else {
            break;
          }
        }

        // Add all microtasks from the selected groups to microtasks
        await BBPromise.mapSeries(chosenMicrotaskGroups, async (group) => {
          const microtasks = await BasicModel.getRecords('microtask', {
            group_id: group.id,
          });

          // reorder microtasks based on microtask assignment order
          reorder(microtasks, task.microtask_assignment_order);

          chosenMicrotasks = chosenMicrotasks.concat(microtasks);
        });
      } else if (task.assignment_granularity === 'MICROTASK') {
        // check if there is a max limit on microtasks
        // TODO: below line is a hack. Will likely get fixed when we move to more
        // consistent policyhandling
        const microtaskLimit = (taskAssignment.params.maxMicrotasksPerUser as number) || 0;
        let assignLimit = 1000;
        let assignedCount = -1;
        if (microtaskLimit > 0) {
          assignedCount = await MicrotaskModel.getAssignedCount(worker.id, task.id);
          assignLimit = microtaskLimit - assignedCount;
          if (assignLimit < 0) assignLimit = 0;
        }

        if (assignLimit == 0) {
          assignmentLogger.info({
            worker_id: worker.id,
            task_id: task.id,
            batch_size: batchSize,
            limit: microtaskLimit,
            previous: assignedCount,
            current: assignLimit,
            message: 'Assignment limit reached',
          });
          return;
        }

        assignmentLogger.info({ worker_id: worker.id, message: `Getting microtasks from ${task.id}` });

        // get all assignable microtasks
        let assignableMicrotasks = await policy.assignableMicrotasks(worker, task, taskAssignment.params);

        // reorder according to task spec
        reorder(assignableMicrotasks, task.microtask_assignment_order);

        assignLimit = assignLimit < batchSize ? assignLimit : batchSize;
        assignableMicrotasks = assignableMicrotasks.slice(0, assignLimit);

        assignmentLogger.info({
          worker_id: worker.id,
          task_id: task.id,
          batch_size: batchSize,
          limit: microtaskLimit,
          previous: assignedCount,
          current: assignLimit,
          actual: assignableMicrotasks.length,
        });

        // Identify prefix that fits within max credits
        for (const microtask of assignableMicrotasks) {
          if (availableCredits - microtask.credits > 0) {
            chosenMicrotasks.push(microtask);
            availableCredits -= microtask.credits;
          } else {
            break;
          }
        }
      } else {
        throw new Error('Invalid assignment granularity for task');
      }

      if (chosenMicrotasks.length > 0) {
        tasksAssigned = true;
      }

      // Assign all microtask groups and microtasks to the user
      await BBPromise.mapSeries(chosenMicrotaskGroups, async (group) => {
        await BasicModel.insertRecord('microtask_group_assignment', {
          box_id: worker.box_id,
          group_id: group.id,
          worker_id: worker.id,
          status: 'ASSIGNED',
        });
      });

      await BBPromise.mapSeries(chosenMicrotasks, async (microtask) => {
        await BasicModel.insertRecord('microtask_assignment', {
          box_id: worker.box_id,
          task_id: task.id,
          microtask_id: microtask.id,
          worker_id: worker.id,
          deadline: microtask.deadline,
          wgroup: worker.wgroup,
          max_base_credits: microtask.base_credits,
          base_credits: 0.0,
          max_credits: microtask.credits,
          status: 'ASSIGNED',
        });
      });
    });

    assignmentLogger.info({ worker_id: worker.id, message: 'Assignment completed' });
    assigning[worker.id] = false;
  } catch (e) {
    assigning[worker.id] = false;
    assignmentLogger.info({ worker_id: worker.id, message: 'Exception in assignment service' });
  }
}

/**
 * Handle microtask assignment completion
 * @param microtaskAssignment Microtask assignment record
 */
export async function handleMicrotaskAssignmentCompletion(microtaskAssignment: MicrotaskAssignmentRecord) {
  // fetch the microtask using the microtask id stored in microtask assignment
  const microtask = await BasicModel.getSingle('microtask', {
    id: microtaskAssignment.microtask_id,
  });

  // fetch task assignment using the task id and the box id
  const taskAssignment = await BasicModel.getSingle('task_assignment', {
    task_id: microtask.task_id,
    box_id: microtaskAssignment.box_id,
  });

  const policy_name = taskAssignment.policy as PolicyName;
  const policy = localPolicyMap[policy_name];

  // Invoke handler for policy
  await policy.handleAssignmentCompletion(microtaskAssignment, taskAssignment.params);
}

/**
 * Reorder elements of an array based on the sort order
 * @param array Array to be shuffled
 */
function reorder<T extends { id: string }>(array: T[], order: AssignmentOrder) {
  if (order === 'RANDOM') {
    let currentIndex = array.length;
    let temporaryValue: T;
    let randomIndex: number;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex = currentIndex - 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  } else if (order === 'SEQUENTIAL') {
    array.sort((m1, m2) => Number.parseInt(m1.id, 10) - Number.parseInt(m2.id, 10));
  } else {
    throw new Error('Invalid assignment order');
  }
}

/**
 * Check if a task is assignable to a worker
 * @param task Task record
 * @param worker Worker record
 */
function assignable(task: TaskRecord, taskAssignment: TaskAssignmentRecord, worker: WorkerRecord): boolean {
  let workerTags = worker.tags.tags;
  if (worker.wgroup) workerTags.push(worker.wgroup);

  let taskTags = task.itags.itags;
  if (task.wgroup) taskTags.push(task.wgroup);

  const taskAssignmentTags = (taskAssignment.params.tags as string[]) ?? [];
  taskTags = taskTags.concat(taskAssignmentTags);

  return taskTags.every((tag) => workerTags.includes(tag));
}
