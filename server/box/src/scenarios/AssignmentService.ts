// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as BBPromise from 'bluebird';
import box_id from '../config/box_id';
import {
  AssignmentOrderType,
  MicrotaskAssignmentRecord,
  MicrotaskGroupAssignmentRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  TaskRecord,
  WorkerLanguageSkillRecord,
  WorkerRecord,
} from '../db/TableInterfaces.auto';
import * as BasicModel from '../models/BasicModel';
import * as MicrotaskGroupModel from '../models/MicroTaskGroupModel';
import { hasIncompleteMicrotasks } from '../models/MicroTaskModel';
import { SkillSpecs } from '../scenarios/common/SkillSpecs';
import { scenarioMap } from '../scenarios/Index';

/**
 * Assign microtask/microtaskgroup depending on the task to a worker and returns the assignments
 * @param worker worker to whom assignments will be assigned
 * @param maxCredits max amount of credits of tasks that will assigned to the user
 */
export async function assignMicrotasksForWorker(
  worker: WorkerRecord,
  maxCredits: number,
): Promise<void> {
  // Check if the worker has incomplete assignments. If so, return
  const hasCurrentAssignments = await hasIncompleteMicrotasks(worker.id);
  if (hasCurrentAssignments) {
    return;
  }

  let availableCredits = maxCredits;
  let tasksAssigned = false;

  // get all available tasks i.e. all of which are in assigned state
  const taskAssignments = await BasicModel.getRecords('task_assignment', {
    box_id,
    status: 'assigned',
  });

  // iterate over all tasks to see which all can user perform
  await BBPromise.mapSeries(taskAssignments, async taskAssignment => {
    if (tasksAssigned) {
      return;
    }

    // Get task for the assignment
    const task = await BasicModel.getSingle('task', {
      id: taskAssignment.task_id,
    });

    // Get scenario for the task
    const scenario = await BasicModel.getSingle('scenario', {
      id: task.scenario_id,
    });

    // match the skills required for the task's scenario and skills of the user
    const doesWorkerSkillMatch = await matchSkills(
      scenario.skills as SkillSpecs,
      task,
      worker,
    );

    if (!doesWorkerSkillMatch) {
      return;
    }

    // Hack to send only 100 verification tasks per round
    if (scenario.name === 'speech-verification') {
      availableCredits = availableCredits > 50 ? 50 : availableCredits;
    }

    // Get policy
    const policy = await BasicModel.getSingle('policy', {
      id: taskAssignment.policy_id,
    });

    // extract the policy object defined inside the code
    const policyObj = scenarioMap[scenario.name].policyMap[policy.name];

    const chosenMicrotaskGroups: MicrotaskGroupRecord[] = [];
    let chosenMicrotasks: MicrotaskRecord[] = [];

    if (task.assignment_granularity === 'group') {
      // Get all assignable microtask groups
      const assignableGroups = await policyObj.getAssignableMicrotaskGroups(
        worker,
        task,
        taskAssignment,
        policy,
      );

      // Reorder the groups based on assignment order
      reorder(assignableGroups, task.group_assignment_order);

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
      await BBPromise.mapSeries(chosenMicrotaskGroups, async group => {
        const microtasks = await BasicModel.getRecords('microtask', {
          group_id: group.id,
        });

        // reorder microtasks based on microtask assignment order
        reorder(microtasks, task.microtask_assignment_order);

        chosenMicrotasks = chosenMicrotasks.concat(microtasks);
      });
    } else if (task.assignment_granularity === 'microtask') {
      // get all assignable microtasks
      const assignableMicrotasks = await policyObj.getAssignableMicrotasks(
        worker,
        task,
        taskAssignment,
        policy,
      );

      // reorder according to task spec
      reorder(assignableMicrotasks, task.microtask_assignment_order);

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
    await BBPromise.mapSeries(chosenMicrotaskGroups, async group => {
      await BasicModel.insertRecord('microtask_group_assignment', {
        microtask_group_id: group.id,
        worker_id: worker.id,
        status: 'assigned',
      });
    });

    await BBPromise.mapSeries(chosenMicrotasks, async microtask => {
      await BasicModel.insertRecord('microtask_assignment', {
        microtask_id: microtask.id,
        worker_id: worker.id,
        status: 'assigned',
      });
    });
  });
}

/**
 * Handle microtask assignment completion
 * @param microtaskAssignment Microtask assignment record
 */
export async function handleMicrotaskAssignmentCompletion(
  microtaskAssignment: MicrotaskAssignmentRecord,
) {
  // fetch the microtask using the microtask id stored in microtask assignment
  const microtask = await BasicModel.getSingle('microtask', {
    id: microtaskAssignment.microtask_id,
  });

  // fetch task assignment using the task id and the box id
  const taskAssignment = await BasicModel.getSingle('task_assignment', {
    task_id: microtask.task_id,
    box_id,
  });

  // fetch policy
  const policy = await BasicModel.getSingle('policy', {
    id: taskAssignment.policy_id,
  });

  // fetch policy object
  const scenario = await BasicModel.getSingle('scenario', {
    id: policy.scenario_id,
  });
  const policyObj = scenarioMap[scenario.name].policyMap[policy.name];

  // Invoke handler for policy
  await policyObj.handleMicrotaskAssignmentCompletion(
    microtaskAssignment,
    microtask,
    taskAssignment,
  );
}

/**
 * Handle microtask group assignment completion
 * @param microtaskGroupAssignment Microtask group assignment record
 */
export async function handleMicrotaskGroupAssignmentCompletion(
  microtaskGroupAssignment: MicrotaskGroupAssignmentRecord,
) {
  // fetch microtask group
  const microtaskGroup = await BasicModel.getSingle('microtask_group', {
    id: microtaskGroupAssignment.microtask_group_id,
  });

  // fetch task assignment
  const taskAssignment = await BasicModel.getSingle('task_assignment', {
    task_id: microtaskGroup.task_id,
    box_id,
  });

  // fetch policy
  const policy = await BasicModel.getSingle('policy', {
    id: taskAssignment.policy_id,
  });

  // fetch policy object
  const scenario = await BasicModel.getSingle('scenario', {
    id: policy.scenario_id,
  });
  const policyObj = scenarioMap[scenario.name].policyMap[policy.name];

  // Invoke handler for policy
  await policyObj.handleMicrotaskGroupAssignmentCompletion(
    microtaskGroupAssignment,
    microtaskGroup,
    taskAssignment,
  );
}

/**
 * Check if the worker's skills match those needed for the specific task
 * @param skillsRequired Set of required skills for the scenario
 * @param task Task (to retrieve language ID)
 * @param worker Current worker
 */
async function matchSkills(
  skillsRequired: SkillSpecs,
  task: TaskRecord,
  worker: WorkerRecord,
): Promise<boolean> {
  // Get the skill record for the worker in the specific language
  let skill: WorkerLanguageSkillRecord;
  try {
    skill = await BasicModel.getSingle('worker_language_skill', {
      language_id: task.language_id,
      worker_id: worker.id,
    });
  } catch (err) {
    // Worker has no skills in the given language
    return false;
  }

  const l1Reqs = skillsRequired.l1;

  // Skill score check
  if (
    l1Reqs.read > 0 &&
    (!skill.can_read ||
      !skill.read_score ||
      skill.read_score < l1Reqs.read ||
      skill.read_score - l1Reqs.read > 5)
  ) {
    return false;
  }

  if (
    l1Reqs.speak > 0 &&
    (!skill.can_speak ||
      !skill.speak_score ||
      skill.speak_score < l1Reqs.speak ||
      skill.speak_score - l1Reqs.speak > 5)
  ) {
    return false;
  }
  if (
    l1Reqs.type > 0 &&
    (!skill.can_type ||
      !skill.type_score ||
      skill.type_score < l1Reqs.type ||
      skill.type_score - l1Reqs.type > 5)
  ) {
    return false;
  }

  // TODO: Check skills in secondary language

  return true;
}

/**
 * Reorder elements of an array based on the sort order
 * @param array Array to be shuffled
 */
function reorder<T extends { id: number }>(
  array: T[],
  order: AssignmentOrderType,
) {
  if (order === 'random') {
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
  } else if (order === 'sequential') {
    array.sort((m1, m2) => m1.id - m2.id);
  } else {
    throw new Error('Invalid assignment order');
  }
}
