// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { BaseScenarioInterface } from './ScenarioInterface';
import { BaseSpeechDataScenario, baseSpeechDataScenario } from './scenarios/SpeechData';
import { BaseSpeechVerificationScenario, baseSpeechVerificationScenario } from './scenarios/SpeechVerification';
import { BaseTextTranslationScenario, baseTextTranslationScenario } from './scenarios/TextTranslation';
import { BaseSignLanguageVideoScenario, baseSignLanguageVideoScenario } from './scenarios/SignLanguageVideo';
import { MicrotaskAssignmentRecord, MicrotaskRecord, TaskRecord } from '../auto/TableInterfaces';

export * from './ScenarioInterface';
export * from './scenarios/SpeechData';
export * from './scenarios/TextTranslation';
export * from './scenarios/SpeechVerification';
export * from './scenarios/SignLanguageVideo';

// List of scenario names
export const scenarioNames = ['SPEECH_DATA', 'TEXT_TRANSLATION', 'SPEECH_VERIFICATION', 'SIGN_LANGUAGE_VIDEO'] as const;
export type ScenarioName = typeof scenarioNames[number];

// Scenario name to type map
export type ScenarioType<SN extends ScenarioName> = SN extends 'SPEECH_DATA'
  ? BaseSpeechDataScenario
  : SN extends 'TEXT_TRANSLATION'
  ? BaseTextTranslationScenario
  : SN extends 'SPEECH_VERIFICATION'
  ? BaseSpeechVerificationScenario
  : SN extends 'SIGN_LANGUAGE_VIDEO'
  ? BaseSignLanguageVideoScenario
  : never;

// Scenario name to instance map
export const scenarioMap: { [key in ScenarioName]: BaseScenarioInterface<any, object, any, object, any> } = {
  SPEECH_DATA: baseSpeechDataScenario,
  TEXT_TRANSLATION: baseTextTranslationScenario,
  SPEECH_VERIFICATION: baseSpeechVerificationScenario,
  SIGN_LANGUAGE_VIDEO: baseSignLanguageVideoScenario,
};

// Utility types to extract task, microtask, assignment record types
export type TaskRecordType<SN extends ScenarioName> = ScenarioType<SN> extends BaseScenarioInterface<
  infer TaskParamsType,
  infer _InputDataType,
  infer _InputFilesType,
  infer _OutputDataType,
  infer _OutputFilesType
>
  ? TaskRecord<TaskParamsType> & { scenario_name: SN }
  : never;

export type TaskType<SN extends ScenarioName> = Partial<TaskRecordType<SN>>;

export type MicrotaskRecordType<SN extends ScenarioName> = ScenarioType<SN> extends BaseScenarioInterface<
  infer _TaskParamsType,
  infer InputDataType,
  infer InputFilesType,
  infer OutputDataType,
  infer OutputFilesType
>
  ? MicrotaskRecord<InputDataType, InputFilesType, OutputDataType, OutputFilesType>
  : never;

export type MicrotaskType<SN extends ScenarioName> = Partial<MicrotaskRecordType<SN>>;

export type AssignmentRecordType<SN extends ScenarioName> = ScenarioType<SN> extends BaseScenarioInterface<
  infer _TaskParamsType,
  infer _InputDataType,
  infer _InputFilesType,
  infer OutputDataType,
  infer OutputFilesType
>
  ? MicrotaskAssignmentRecord<OutputDataType, OutputFilesType>
  : never;

export type AssignmentType<SN extends ScenarioName> = Partial<AssignmentRecordType<SN>>;
