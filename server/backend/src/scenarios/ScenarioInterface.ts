// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Extends base scenario interface to include backend specific functions

import { BaseScenarioInterface, Microtask, MicrotaskGroup, TaskRecord } from '@karya/core';

/**
 * MicrotaskList: Represents the response type of the microtask generator. This
 * object succintly represents the list of all microtask groups and microtasks
 * that should be generated for a particular task. At the top level, it is an
 * array of microtask groups, each with an object specifying the details of the
 * group and a list of microtasks associated with the group. Each microtask
 * in turn contains microtask object and a list of input files associated with
 * the microtask.
 *
 * If the scenario does not have the notion of a group, then this of groups,
 * then this object contains a single element with the group object set to null.
 */
export type MicrotaskList = {
  mg: MicrotaskGroup | null;
  microtasks: Microtask[];
}[];

// Extend base scenario interface with functions to process input files and
// generate output files
export interface BackendScenarioInterface extends BaseScenarioInterface {
  /**
   * Process a newly submitted input for a specific task.
   * @param task Task record for the submitted input files
   * @param jsonFilePath Path to JSON file associated with the input
   * @param tarFilePath Path to tar file associated with the input
   * @param task_folder Temporary folder for processing the request
   */
  processInputFile(
    task: TaskRecord,
    jsonData?: any,
    tarFilePath?: string,
    task_folder?: string
  ): Promise<MicrotaskList>;

  /**
   * Generate output for a given task.
   * @param task Task for which output has to be generated
   * @param task_folder Temporary folder for processing the request
   */
  generateOutput?(task: TaskRecord, task_folder?: string): Promise<void>;
}
