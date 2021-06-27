// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { MicrotaskAssignmentRecord, MicrotaskRecord, TaskRecord } from '../auto/TableInterfaces';
import { PolicyName, PolicyParamsType } from '../policies/Index';

import { BaseScenarioInterface } from './ScenarioInterface';
import { BaseSpeechDataScenario, baseSpeechDataScenario } from './scenarios/SpeechData';
import { BaseSpeechVerificationScenario, baseSpeechVerificationScenario } from './scenarios/SpeechVerification';
import { BaseTextTranslationScenario, baseTextTranslationScenario } from './scenarios/TextTranslation';
import { BaseSignLanguageVideoScenario, baseSignLanguageVideoScenario } from './scenarios/SignLanguageVideo';
import { baseMVXliterationScenario, BaseMVXliterationScenario } from './scenarios/MVXLiteration';
import {
  baseMVXliterationVerificationScenario,
  BaseMVXliterationVerificationScenario,
} from './scenarios/MVXLiterationVerification';
import { baseXliterationDataScenario, BaseXliterationDataScenario } from './scenarios/XliterationData';

export * from './ScenarioInterface';
export * from './scenarios/SpeechData';
export * from './scenarios/TextTranslation';
export * from './scenarios/SpeechVerification';
export * from './scenarios/SignLanguageVideo';
export * from './scenarios/MVXLiteration';
export * from './scenarios/MVXLiterationVerification';
export * from './scenarios/XliterationData';

// List of scenario names
export const scenarioNames = [
  'SPEECH_DATA',
  'TEXT_TRANSLATION',
  'SPEECH_VERIFICATION',
  'SIGN_LANGUAGE_VIDEO',
  'XLITERATION_DATA',
  'MV_XLITERATION',
  'MV_XLITERATION_VERIFICATION',
] as const;
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
  : SN extends 'MV_XLITERATION'
  ? BaseMVXliterationScenario
  : SN extends 'MV_XLITERATION_VERIFICATION'
  ? BaseMVXliterationVerificationScenario
  : SN extends 'XLITERATION_DATA'
  ? BaseXliterationDataScenario
  : never;

// Scenario name to instance map
export const scenarioMap: {
  [key in ScenarioName]: BaseScenarioInterface<key, any, object, any, object, any>;
} = {
  SPEECH_DATA: baseSpeechDataScenario,
  TEXT_TRANSLATION: baseTextTranslationScenario,
  SPEECH_VERIFICATION: baseSpeechVerificationScenario,
  SIGN_LANGUAGE_VIDEO: baseSignLanguageVideoScenario,
  MV_XLITERATION: baseMVXliterationScenario,
  MV_XLITERATION_VERIFICATION: baseMVXliterationVerificationScenario,
  XLITERATION_DATA: baseXliterationDataScenario,
};

// Utility types to extract task, microtask, assignment record types
export type TaskRecordType<
  SN extends ScenarioName = ScenarioName,
  PN extends PolicyName = PolicyName
> = ScenarioType<SN> extends BaseScenarioInterface<
  SN,
  infer TaskParamsType,
  infer _InputDataType,
  infer _InputFilesType,
  infer _OutputDataType,
  infer _OutputFilesType
>
  ? TaskRecord<TaskParamsType & PolicyParamsType<PN>>
  : never;

export type TaskType<SN extends ScenarioName = ScenarioName> = Partial<TaskRecordType<SN>>;

export type MicrotaskRecordType<
  SN extends ScenarioName = ScenarioName
> = ScenarioType<SN> extends BaseScenarioInterface<
  SN,
  infer _TaskParamsType,
  infer InputDataType,
  infer InputFilesType,
  infer OutputDataType,
  infer OutputFilesType
>
  ? MicrotaskRecord<InputDataType, InputFilesType, OutputDataType, OutputFilesType>
  : never;

export type MicrotaskType<SN extends ScenarioName = ScenarioName> = Partial<MicrotaskRecordType<SN>>;

export type AssignmentRecordType<
  SN extends ScenarioName = ScenarioName
> = ScenarioType<SN> extends BaseScenarioInterface<
  SN,
  infer _TaskParamsType,
  infer _InputDataType,
  infer _InputFilesType,
  infer OutputDataType,
  infer OutputFilesType
>
  ? MicrotaskAssignmentRecord<OutputDataType, OutputFilesType>
  : never;

export type AssignmentType<SN extends ScenarioName = ScenarioName> = Partial<AssignmentRecordType<SN>>;
