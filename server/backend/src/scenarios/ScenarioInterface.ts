// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Extends base scenario interface to include backend specific functions

import {
  AssignmentRecordType,
  BaseScenarioInterface,
  MicrotaskGroup,
  MicrotaskRecordType,
  MicrotaskType,
  ScenarioName,
  TaskRecordType,
} from '@karya/core';

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
export type MicrotaskList<SN extends ScenarioName = ScenarioName> = {
  mg: MicrotaskGroup | null;
  microtasks: MicrotaskType<SN>[];
}[];

// Extend base scenario interface with functions to process input files and
// generate output files
export interface BackendScenarioInterface<
  SN extends ScenarioName,
  ScenarioParams,
  MicrotaskInput,
  MicrotaskInputFiles,
  MicrotaskOutput,
  MicrotaskOutputFiles
> extends BaseScenarioInterface<
    SN,
    ScenarioParams,
    MicrotaskInput,
    MicrotaskInputFiles,
    MicrotaskOutput,
    MicrotaskOutputFiles
  > {
  /**
   * Process a newly submitted input for a specific task.
   * @param task Task record for the submitted input files
   * @param jsonFilePath Path to JSON file associated with the input
   * @param tarFilePath Path to tar file associated with the input
   * @param task_folder Temporary folder for processing the request
   */
  processInputFile(
    task: TaskRecordType<SN>,
    jsonData?: any,
    tarFilePath?: string,
    task_folder?: string
  ): Promise<MicrotaskList<SN>>;

  /**
   * Generate output files for a particular task. All the output files are
   * stored in the task folder. The function returns a list of files that have
   * to be zipped together and uploaded.
   * @param task Task record for the which output should be generated
   * @param assignments List of verified assignments from the last output generation
   * @param microtasks  List of completed microtasks from the last output generation
   * @param task_folder Task folder to store the list of files
   * @param timestamp Unique timestamp associated with the output
   */
  generateOutput(
    task: TaskRecordType<SN>,
    assignments: AssignmentRecordType<SN>[],
    microtasks: MicrotaskRecordType<SN>[],
    task_folder: string,
    timestamp: string
  ): Promise<string[]>;
}

// Shorthand for backend scenario interface type
export type IBackendScenarioInterface<S> = S extends BaseScenarioInterface<
  infer SN,
  infer A,
  infer B,
  infer C,
  infer D,
  infer E
>
  ? BackendScenarioInterface<SN, A, B, C, D, E>
  : never;
