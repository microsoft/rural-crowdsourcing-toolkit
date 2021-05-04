// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { ScenarioInterface } from './ScenarioInterface';
import { SpeechDataScenario } from './scenarios/SpeechData';

export * from './ScenarioInterface';
export * from './scenarios/SpeechData';

// List of scenario names
export const scenarioNames = ['speech-data'] as const;
export type ScenarioName = typeof scenarioNames[number];

export const scenarioMap: { [key in ScenarioName]: ScenarioInterface } = {
  'speech-data': SpeechDataScenario,
};
