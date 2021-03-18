// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Box implementation of the speech verification scenario
 */

import { IScenario } from '../common/ScenarioInterface';
import { SpeechVerificationTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';

export const SpeechVerificationScenario: IScenario = {
  name: 'speech-verification',
  full_name: 'Speech Data Verification',
  description:
    'This task involves verifying speech data recordings. Each microtask consists of a prompt and a recording. The worker must check if the recording corresponds to the prompt.',

  task_params: taskParams,
  skills: { l1: { read: 10 } },

  assignment_granularity: 'microtask',
  group_assignment_order: 'either',
  microtask_assignment_order: 'sequential',

  enabled: true,

  policies: [defaultPolicy],
  policyMap: {},
};

SpeechVerificationScenario.policies.forEach(policy => {
  SpeechVerificationScenario.policyMap[policy.name] = policy;
});

export { SpeechVerificationTask };
