// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the scenario interface. Any newly created scenario must
// implement this interface
//
// This Scenario interface extends the Scenario type by 1) specifying parameters
// that must necessarily be provided for a new scenario, and 2) a set of
// functions that should be implemented as part of the newly created scenario.

import {
  AssignmentGranularityType,
  AssignmentOrderType,
  Microtask,
  MicrotaskAssignmentRecord,
  MicrotaskGroup,
  MicrotaskRecord,
  Scenario,
  TaskRecord,
} from '@karya/db';

import { ParameterDefinition } from './ParameterTypes';
import { IPolicy } from './PolicyInterface';
import { SkillSpecs } from './SkillSpecs';

/** Task Validator response */
export type TaskValidatorResponse =
  | {
      success: true;
    }
  | {
      success: false;
      message: string[];
    };

/** Budget Estimator response */
export type BudgetEstimatorResponse =
  | {
      success: true;
      budget: number;
    }
  | {
      success: false;
      budget: null;
      message: string;
    };

/** Microtask generator response */
export type MicrotaskGeneratorResponse =
  | {
      success: true;
      task_folder?: string;
      microtaskGroups: {
        mg_info: MicrotaskGroup | null;
        microtasks: {
          m_info: Microtask;
          files?: string[];
        }[];
      }[];
      fileMap?: { [key: string]: string[] };
    }
  | {
      success: false;
      message: string;
    };

export interface IScenario extends Scenario {
  // necessary parameters that should be specified at the time of
  // creating a new scenario.

  name: string;
  full_name: string;
  description: string;

  task_params: { params: ParameterDefinition[] };
  skills: SkillSpecs;

  assignment_granularity: AssignmentGranularityType;
  group_assignment_order: AssignmentOrderType;
  microtask_assignment_order: AssignmentOrderType;

  // task validator function. this function must check if a newly submitted task
  // is valid.
  validateTask(task: TaskRecord): Promise<TaskValidatorResponse>;

  // task budget estimator function. this function must estimate the budget for
  // completing the given task.
  estimateTaskBudget(task: TaskRecord): Promise<BudgetEstimatorResponse>;

  // microtask generator. this function splits the given task into related
  // microtask groups and microtasks and return that list.
  generateMicrotasks(task: TaskRecord): Promise<MicrotaskGeneratorResponse>;

  /**
   * Handler for microtask completion at the server. This handler can be used to
   * put together files, mark assignments as verified, etc.
   * @param mt The completed microtask record
   * @param task The task record corresponding to the completed microtask
   */
  handleMicrotaskCompletion(
    mt: MicrotaskRecord,
    task: TaskRecord,
  ): Promise<void>;

  /**
   * Handler for microtask assignment completion at the server. This handler can
   * be used, for instance, to create verification microtask for the completed
   * assignment.
   * @param mta The completed microtask assignment record
   * @param mt The microtask record corresponding to the assignment
   * @param task The task record corresponding to the assignment
   */
  handleMicrotaskAssignmentCompletion(
    mta: MicrotaskAssignmentRecord,
    mt: MicrotaskRecord,
    task: TaskRecord,
  ): Promise<void>;

  /**
   * Optional output generator
   */
  outputGenerator?(task: TaskRecord): Promise<void>;

  // Policies associated with the scenario
  policies: IPolicy[];

  // can the tasks be validated synchronously?
  synchronous_validation: boolean;

  // is the scenario enabled? set to true only if all functions are provided
  enabled: boolean;
}
