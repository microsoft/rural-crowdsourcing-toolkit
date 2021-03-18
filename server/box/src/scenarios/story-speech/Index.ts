// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the story-speech scenario and related task types

import { IScenario } from '../common/ScenarioInterface';
import { StorySpeechTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';

export const StorySpeechScenario: IScenario = {
  name: 'story-speech',
  full_name: 'Group Speech Data Collection',
  description:
    'This task consists of a set of stories. The worker is expected to record themselves reading out each story, one sentence at a time',

  task_params: taskParams,
  skills: { l1: { read: 1, speak: 1 } },

  assignment_granularity: 'group',
  group_assignment_order: 'either',
  microtask_assignment_order: 'either',

  enabled: false,

  policies: [defaultPolicy],
  policyMap: {},
};
StorySpeechScenario.policies.forEach(policy => {
  StorySpeechScenario.policyMap[policy.name] = policy;
});

export { StorySpeechTask };
