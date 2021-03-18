// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Main interface file between platforms and scenarios

import { IScenario } from './common/ScenarioInterface';

// story speech scenario
import { IPolicy } from './common/PolicyInterface';
import { SpeechDataScenario } from './speech-data/Index';
import { SpeechVerificationScenario } from './speech-verification/Index';
import { StorySpeechScenario } from './story-speech/Index';

// list of scenarios
const scenarioList: IScenario[] = [
  StorySpeechScenario,
  SpeechDataScenario,
  SpeechVerificationScenario,
];

// create the scenario map
export const scenarioMap: { [id: string]: IScenario } = {};
for (const scenario of scenarioList) {
  const policyMap: { [id: string]: IPolicy } = {};
  const policiesList = scenario.policies;
  for (const policy of policiesList) {
    policyMap[policy.name] = policy;
  }
  scenario.policyMap = policyMap;
  scenarioMap[scenario.name] = scenario;
}

// export types from scenario interface
export { IScenario };
