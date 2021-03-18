// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the speech data scenario and related task types

import { IScenario } from '../common/ScenarioInterface';
import { SpeechDataTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';

export const SpeechDataScenario: IScenario = {
  name: 'speech-data',
  full_name: 'Speech Data Collection',
  description:
    'This task consists of a list of sentences. The worker is expected to record themselves reading out each story, one sentence at a time',

  task_params: taskParams,
  skills: { l1: { read: 1, speak: 1 } },

  assignment_granularity: 'microtask',
  group_assignment_order: 'either',
  microtask_assignment_order: 'either',

  enabled: true,

  policies: [defaultPolicy],
  policyMap: {},
};

SpeechDataScenario.policies.forEach(policy => {
  SpeechDataScenario.policyMap[policy.name] = policy;
});

export { SpeechDataTask };
