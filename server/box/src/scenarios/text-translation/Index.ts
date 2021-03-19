// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the text translation scenario and related task types

import { IScenario } from '../common/ScenarioInterface';
import { TextTranslationTask, taskParams } from './ParamDefinitions';
import { defaultPolicy } from './policy/default/Index';

export const TextTranslationScenario: IScenario = {
  name: 'text-translation',
  full_name: 'text-translation data Collection',
  description:
    'This task consists of a set of sentences. The worker is expected to provide translation for one sentence at a time',

  task_params: taskParams,
  skills: { l1: { read: 1, speak: 1 } },

  assignment_granularity: 'microtask',
  group_assignment_order: 'either',
  microtask_assignment_order: 'either',

  enabled: true,

  policies: [defaultPolicy],
  policyMap: {},
};

TextTranslationScenario.policies.forEach(policy => {
  TextTranslationScenario.policyMap[policy.name] = policy;
});

export { TextTranslationTask };
