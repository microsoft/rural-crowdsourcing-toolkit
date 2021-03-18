// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the policy interface. Any newly created policy must
// implement this interface
//
// This Policy interface extends the Policy type by 1) specifying parameters
// that must necessarily be provided for a new policy, and 2) a set of
// functions that should be implemented as part of the newly created scenario.

import {
  MicrotaskAssignmentRecord,
  MicrotaskGroupAssignmentRecord,
  MicrotaskGroupRecord,
  MicrotaskRecord,
  Policy,
  PolicyRecord,
  TaskAssignmentRecord,
  TaskRecord,
  WorkerRecord,
} from '../../db/TableInterfaces.auto';

export type GetAssignmentsResponse = {
  success: boolean;
  microtaskGroups: MicrotaskGroupRecord[];
  microtasks: MicrotaskRecord[];
  message: string;
};

/**
 * Policy interface for the box repo
 */
export interface IPolicy extends Policy {
  name: string;

  getAssignableMicrotasks(
    worker: WorkerRecord,
    task: TaskRecord,
    taskAssignment: TaskAssignmentRecord,
    policy: PolicyRecord,
  ): Promise<MicrotaskRecord[]>;

  getAssignableMicrotaskGroups(
    worker: WorkerRecord,
    task: TaskRecord,
    taskAssignment: TaskAssignmentRecord,
    policy: PolicyRecord,
  ): Promise<MicrotaskGroupRecord[]>;

  handleMicrotaskAssignmentCompletion(
    microtaskAssignment: MicrotaskAssignmentRecord,
    microtask: MicrotaskRecord,
    taskAssignment: TaskAssignmentRecord,
  ): Promise<void>;

  handleMicrotaskGroupAssignmentCompletion(
    microtaskGroup: MicrotaskGroupAssignmentRecord,
    microtaskGroupAssignment: MicrotaskGroupRecord,
    taskAssignment: TaskAssignmentRecord,
  ): Promise<void>;
}
