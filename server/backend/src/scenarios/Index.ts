// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Main interface file between platforms and scenarios

import { IScenario } from './common/ScenarioInterface';

// story speech scenario
import { SpeechDataScenario } from './speech-data/Index';
import { SpeechVerificationScenario } from './speech-verification/Index';
import { StorySpeechScenario } from './story-speech/Index';

// list of scenarios
const scenarioList: IScenario[] = [
  SpeechDataScenario,
  StorySpeechScenario,
  SpeechVerificationScenario,
];

// create the scenario map
export const scenarioMap: { [id: string]: IScenario } = {};
for (const scenario of scenarioList) {
  scenarioMap[scenario.name] = scenario;
}

// scenario by Id
export const scenarioById: { [id: number]: IScenario } = {};

// export types from scenario interface
export { IScenario };
export {
  TaskValidatorResponse,
  BudgetEstimatorResponse,
  MicrotaskGeneratorResponse,
} from './common/ScenarioInterface';
