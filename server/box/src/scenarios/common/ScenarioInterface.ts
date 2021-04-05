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
  Scenario,
} from '@karya/db';

import { ParameterDefinition } from './ParameterTypes';
import { IPolicy } from './PolicyInterface';

export interface IScenario extends Scenario {
  // necessary parameters that should be specified at the time of
  // creating a new scenario.

  name: string;
  full_name: string;
  description: string;

  task_params: ParameterDefinition[];
  skills: object;

  assignment_granularity: AssignmentGranularityType;
  group_assignment_order: AssignmentOrderType;
  microtask_assignment_order: AssignmentOrderType;

  policies: IPolicy[];

  policyMap: { [id: string]: IPolicy };

  // is the scenario enabled? set to true only if all functions are provided
  enabled: boolean;
}
