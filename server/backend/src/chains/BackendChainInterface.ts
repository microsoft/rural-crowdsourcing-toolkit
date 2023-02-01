// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Backend task chaining interface.
//
// This file describes the backend interface for task chaining. This interface
// extends the base chain interface with two handlers: one to process completed
// assignments of the "from task" of the chains and one to process completed
// microtasks of the "to task".

import {
  AssignmentRecordType,
  BaseChainInterface,
  MicrotaskRecordType,
  MicrotaskType,
  ScenarioName,
  TaskRecordType,
} from '@karya/core';

/**
 * Chained microtask record type
 *
 * Adds the following extra chain-related inputs to the microtask:
 *
 * assignmentId: ID of the assignment that created this microtask
 * microtaskId: ID of the microtask of the corresponding assignment
 * taskId: ID of the task of the correpsonding assignment
 * workerId: ID of the worker who completed the assignment
 */
export type ChainedMicrotaskRecordType<SN extends ScenarioName = ScenarioName> = MicrotaskRecordType<SN> & {
  input: {
    chain: {
      linkId: string;
      assignmentId: string;
      microtaskId: string;
      taskId: string;
      workerId: string;
    };
  };
};
export type ChainedMicrotaskType<SN extends ScenarioName = ScenarioName> = Partial<ChainedMicrotaskRecordType<SN>>;

export interface BackendChainInterface<FromScenario extends ScenarioName, ToScenario extends ScenarioName>
  extends BaseChainInterface<FromScenario, ToScenario> {
  /**
   * Convert a set of completed assignments of the "from" task to a set of
   * microtasks of the "to" task.
   * @param fromTask "from" task record
   * @param toTask "to" task record
   * @param assignments Completed assignments records of the "from" task
   * @param microtasks Microtask records corresponding to the assignment
   */
  handleCompletedFromAssignments(
    fromTask: TaskRecordType<FromScenario>,
    toTask: TaskRecordType<ToScenario>,
    assignments: AssignmentRecordType<FromScenario>[],
    microtasks: MicrotaskRecordType<FromScenario>[],
    task_folder: string
  ): Promise<MicrotaskType<ToScenario>[]>;

  /**
   * Handle a set of completed microtasks of the "to" task and generate updates
   * for the corresponding assignments of the source task.
   * @param fromTask "from" task record
   * @param toTask "to" task record
   * @param microtasks Completed microtask records of the "to" task
   */
  handleCompletedToMicrotasks(
    fromTask: TaskRecordType<FromScenario>,
    toTask: TaskRecordType<ToScenario>,
    microtasks: ChainedMicrotaskRecordType<ToScenario>[],
    assignments: AssignmentRecordType<FromScenario>[]
  ): Promise<AssignmentRecordType<FromScenario>[]>;
}
