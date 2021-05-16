// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { BaseScenarioInterface } from './ScenarioInterface';
import { baseSpeechDataScenario } from './scenarios/SpeechData';

export * from './ScenarioInterface';
export * from './scenarios/SpeechData';

// List of scenario names
export const scenarioNames = ['speech-data'] as const;
export type ScenarioName = typeof scenarioNames[number];

export const scenarioMap: { [key in ScenarioName]: BaseScenarioInterface<any, object, any, object, any> } = {
  'speech-data': baseSpeechDataScenario,
};
