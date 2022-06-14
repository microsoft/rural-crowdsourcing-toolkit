// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry point for backend policy functions

import { BasicModel, MicrotaskModel } from '@karya/common';
import { AssignmentRecordType, MicrotaskRecordType, PolicyName, TaskRecordType } from '@karya/core';
import { Promise as BBPromise } from 'bluebird';
import { backendScenarioMap } from '../../scenarios/Index';
import { backwardTaskLinkQ } from '../Index';

import { BackendPolicyInterface } from './BackendPolicyInterface';
import { nMatchingBackendPolicy } from './NMatchingPolicy';
import { nTotalBackendPolicy } from './NTotalPolicy';
import { nUniqueBackendPolicy } from './NUniquePolicy';

// Backend policy map
const backendPolicyMap: { [key in PolicyName]: BackendPolicyInterface<key> } = {
  N_TOTAL: nTotalBackendPolicy,
  N_UNIQUE: nUniqueBackendPolicy,
  N_MATCHING: nMatchingBackendPolicy,
};

/**
 * Handle a set of newly completed assignments for a particular task. This
 * function extracts the list of microtasks corresponding to the completed
 * assignments. The policy verification function determines if each microtask is
 * completed or not based on the number and output of the completed assignments.
 *
 * @param assignments List of newly completed assignments
 * @param task Task record corresponding to the completed assignments
 */
export async function handleNewlyCompletedAssignments(assignments: AssignmentRecordType[], task: TaskRecordType) {
  // Get all microtasks corresponding to newly completed assignments
  const microtask_ids = assignments.map((a) => a.microtask_id).filter((v, i, self) => self.indexOf(v) === i);
  const microtasks = (await BasicModel.getRecords('microtask', {}, [['id', microtask_ids]])) as MicrotaskRecordType[];

  // Get the policy and scenario object
  const policyObj = backendPolicyMap[task.policy];
  const scenarioObj = backendScenarioMap[task.scenario_name];

  // @ts-ignore -- Need to revisit task record typing
  const [verifiedAssignments, completedMicrotasks] = await policyObj.verify(assignments, microtasks, task);

  // Mark all verified assignments as verified
  await BBPromise.mapSeries(verifiedAssignments, async (assignment) => {
    const verified_at = new Date().toISOString();
    const credits = assignment.credits ?? assignment.max_credits;
    const report = assignment.report;
    await BasicModel.updateSingle(
      'microtask_assignment',
      { id: assignment.id },
      { status: 'VERIFIED', credits, verified_at, report }
    );
  });

  // Mark all completed microtasks as completed
  await BBPromise.mapSeries(completedMicrotasks, async (microtask) => {
    const assignments = await BasicModel.getRecords('microtask_assignment', {
      microtask_id: microtask.id,
      status: 'VERIFIED',
    });
    // @ts-ignore
    const output = await scenarioObj.microtaskOutput(task, microtask, assignments);
    await MicrotaskModel.markComplete(microtask.id, output);
  });

  // If there are any completed microtasks then
  // Execute any backward link for the completed microtasks
  if (completedMicrotasks.length > 0) {
    const taskOp = await BasicModel.insertRecord('task_op', {
      task_id: task.id,
      op_type: 'EXECUTE_BACKWARD_TASK_LINK',
      status: 'CREATED',
    });
    await backwardTaskLinkQ.add({ task, taskOp });
  }
}
