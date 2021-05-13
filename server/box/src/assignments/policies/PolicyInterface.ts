// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// A policy (short for assignment policy) is a specification how microtasks of a
// specific task should be assigned to different users. This file formally
// specifies the interface that should be implemented by any new policy.

import {
  MicrotaskAssignmentRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  TaskRecord,
  WorkerRecord,
  PolicyInterface,
} from '@karya/core';

export interface BoxPolicyInterface<ParamsType = object> extends PolicyInterface {
  /**
   * Get a list of assignable microtasks from a task to a particular user.
   * @param worker Record of worker to whom microtasks have to be assigned
   * @param task Record of the task
   * @param policyParams Parameters of the assignment policy
   */
  assignableMicrotasks(worker: WorkerRecord, task: TaskRecord, policyParams: ParamsType): Promise<MicrotaskRecord[]>;

  /**
   * Get a list of assignable microtask groups from a task to a particular user.
   * @param worker Record of worker to whom microtasks have to be assigned
   * @param task Record of the task
   * @param policyParams Parameters of the assignment policy
   */
  assignableMicrotaskGroups(
    worker: WorkerRecord,
    task: TaskRecord,
    policyParams: ParamsType
  ): Promise<MicrotaskGroupRecord[]>;

  /**
   * Handle completion of a assignment. This function should be called after the
   * assignment is marked as completed.
   * @param assignment Assignment that has been completed
   * @param policyParams Parameters of the assignment policy
   */
  handleAssignmentCompletion(assignment: MicrotaskAssignmentRecord, policyParams: ParamsType): Promise<void>;
}
