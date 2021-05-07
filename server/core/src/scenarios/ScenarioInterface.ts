// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Interface specification of a scenario. All scenarios must implement this
// interface.

import { ScenarioName } from './Index';
import { ParameterDefinition } from '@karya/parameter-specs';
import Joi from 'joi';

/**
 * Assignment granularity: Specifies the granularity at which microtasks of a
 * scenario should be assigned to users.
 *
 * 'microtask': Assignments are made at the individual microtask granularity.
 * 'group': All microtasks belonging to a group are assigned together.
 * 'either': Can be either of the above and specified at the time of task creation.
 */
export type AssignmentGranularity = 'microtask' | 'group' | 'either';

/**
 * Assignment order: Specifies the order in which microtasks of a scenario
 * should be assigned to users.
 *
 * 'sequential': Microtasks or groups are assigned sequentially by creation time.
 * 'random': Microtasks or groups are randomly chosen.
 * 'either': Can be either of the above and specified at the time of task creation.
 */
export type AssignmentOrder = 'sequential' | 'random' | 'either';

/**
 * Microtask response type for the scenario: Specifies the type of response
 * expected for the microtasks of the scenario.
 *
 * 'unique': Each microtask is expected to have a unique objective response.
 *   Example is handwritten image transcription or speech transcription.
 *
 * 'multiple-objective': Each microtask may have multiple responses but
 *   different responses can be objectively compared to one another. Example is
 *   text-to-text translation.
 *
 * 'multiple-subjective': Each microtask may have multiple responses but
 *   different responses cannot be objectively compared to one another. Example
 *   is speech data collection.
 */
export type MicrotaskResponseType = 'unique' | 'multiple-objective' | 'multiple-subjective';

/**
 * Scenario Interface
 *
 * This interface a formal specification of a scenario on the Karya platform.
 */
export interface ScenarioInterface {
  // Unique identifier for the scenario
  name: ScenarioName;

  // Full name of the scenario in English
  full_name: string;

  // Description of the scenario in English
  description: string;

  // Parameters to be supplied with new tasks of this type.
  task_input: ParameterDefinition[];

  // Format for the input files for a task of this scenario. Each input can be a
  // combination of a JSON file and a tar ball. If a JSON file is required, then
  // schema for the JSON should be specified as a Joi schema.
  task_input_file: {
    json:
      | { required: false }
      | {
          required: true;
          description: string;
          schema: Joi.Schema;
        };
    tgz:
      | { required: false }
      | {
          required: true;
          description: string;
        };
  };

  // Input format for microtasks of this scenario. Microtask input contains two
  // components. A JSON input and a set of file inputs.

  // Schema for the JSON input for the microtask
  microtask_input: Joi.ObjectSchema;
  // List of keys for the input files for the microtask
  microtask_input_files: string[];

  // Output format for microtasks of this scenario. Microtask output contains two
  // components. A JSON output and a set of file outputs.

  // Schema for the JSON output for the microtask
  microtask_output: Joi.ObjectSchema;
  // List of keys for the output files for the microtask
  microtask_output_files: string[];

  // Assignment granularity and order
  assignment_granularity: AssignmentGranularity;
  group_assignment_order: AssignmentOrder;
  microtask_assignment_order: AssignmentOrder;

  // microtask response type
  response_type: MicrotaskResponseType;
}
