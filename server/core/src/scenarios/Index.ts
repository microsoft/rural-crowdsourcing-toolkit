// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Entry file for the scenarios

import { MicrotaskAssignmentRecord, MicrotaskRecord, TaskRecord } from '../auto/TableInterfaces';
import { PolicyName, PolicyParamsType } from '../policies/Index';
import { ParameterArray } from '@karya/parameter-specs';

import { BaseScenarioInterface } from './ScenarioInterface';
import { BaseSpeechDataScenario, baseSpeechDataScenario } from './scenarios/SpeechData';
import { BaseSpeechVerificationScenario, baseSpeechVerificationScenario } from './scenarios/SpeechVerification';
import { BaseTextTranslationScenario, baseTextTranslationScenario } from './scenarios/TextTranslation';
import { BaseSignLanguageVideoScenario, baseSignLanguageVideoScenario } from './scenarios/SignLanguageVideo';
import { baseXliterationDataScenario, BaseXliterationDataScenario } from './scenarios/XliterationData';
import {
  baseSignLanguageVideoVerificationScenario,
  BaseSignLanguageVideoVerificationScenario,
} from './scenarios/SignLanguageVideoVerification';
import { baseImageTranscriptionScenario, BaseImageTranscriptionScenario } from './scenarios/ImageTranscription';
import { baseImageLabellingScenario, BaseImageLabellingScenario } from './scenarios/ImageLabelling';
import { baseQuizScenario, BaseQuizScenario } from './scenarios/Quiz';
import { baseImageDataScenario, BaseImageDataScenario } from './scenarios/ImageData';
import { baseSentenceCorpusScenario, BaseSentenceCorpusScenario } from './scenarios/SentenceCorpus';
import {
  baseSentenceCorpusVerificationScenario,
  BaseSentenceCorpusVerificationScenario,
} from './scenarios/SentenceCorpusVerification';

export * from './ScenarioInterface';
export * from './scenarios/SpeechData';
export * from './scenarios/TextTranslation';
export * from './scenarios/SpeechVerification';
export * from './scenarios/SignLanguageVideo';
export * from './scenarios/SignLanguageVideoVerification';
export * from './scenarios/XliterationData';
export * from './scenarios/ImageTranscription';
export * from './scenarios/ImageLabelling';
export * from './scenarios/Quiz';
export * from './scenarios/ImageData';
export * from './scenarios/SentenceCorpus';
export * from './scenarios/SentenceCorpusVerification';

// List of scenario names
export const scenarioNames = [
  'SPEECH_DATA',
  'TEXT_TRANSLATION',
  'SPEECH_VERIFICATION',
  'SIGN_LANGUAGE_VIDEO',
  'SGN_LANG_VIDEO_VERIFICATION',
  'XLITERATION_DATA',
  'IMAGE_TRANSCRIPTION',
  'IMAGE_LABELLING',
  'QUIZ',
  'IMAGE_DATA',
  'SENTENCE_CORPUS',
  'SENTENCE_CORPUS_VERIFICATION',
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
  : SN extends 'SGN_LANG_VIDEO_VERIFICATION'
  ? BaseSignLanguageVideoVerificationScenario
  : SN extends 'XLITERATION_DATA'
  ? BaseXliterationDataScenario
  : SN extends 'IMAGE_TRANSCRIPTION'
  ? BaseImageTranscriptionScenario
  : SN extends 'IMAGE_LABELLING'
  ? BaseImageLabellingScenario
  : SN extends 'QUIZ'
  ? BaseQuizScenario
  : SN extends 'IMAGE_DATA'
  ? BaseImageDataScenario
  : SN extends 'SENTENCE_CORPUS'
  ? BaseSentenceCorpusScenario
  : SN extends 'SENTENCE_CORPUS_VERIFICATION'
  ? BaseSentenceCorpusVerificationScenario
  : never;

// Scenario name to instance map
export const scenarioMap: {
  [key in ScenarioName]: BaseScenarioInterface<key, any, object, any, object, any>;
} = {
  SPEECH_DATA: baseSpeechDataScenario,
  TEXT_TRANSLATION: baseTextTranslationScenario,
  SPEECH_VERIFICATION: baseSpeechVerificationScenario,
  SIGN_LANGUAGE_VIDEO: baseSignLanguageVideoScenario,
  SGN_LANG_VIDEO_VERIFICATION: baseSignLanguageVideoVerificationScenario,
  XLITERATION_DATA: baseXliterationDataScenario,
  IMAGE_TRANSCRIPTION: baseImageTranscriptionScenario,
  IMAGE_LABELLING: baseImageLabellingScenario,
  QUIZ: baseQuizScenario,
  IMAGE_DATA: baseImageDataScenario,
  SENTENCE_CORPUS: baseSentenceCorpusScenario,
  SENTENCE_CORPUS_VERIFICATION: baseSentenceCorpusVerificationScenario,
};

// Core scenario parameters
type CoreScenarioParamsType = {
  instruction: string;
  creditsPerMicrotask: number;
  maxMicrotasksPerUser: number;
  startTime?: string;
  endTime?: string;
};

export const coreScenarioParameters: ParameterArray<CoreScenarioParamsType> = [
  {
    id: 'instruction',
    type: 'string',
    label: 'Microtask Instruction',
    description:
      'Instruction to be given to the user on the client application for them to accurately complete each microtask of this task',
    required: true,
  },

  {
    id: 'creditsPerMicrotask',
    type: 'float',
    label: 'Credits per Microtask',
    description: 'Number of credits to be given to a user for successfully completing each microtask of this task',
    required: true,
  },

  {
    id: 'maxMicrotasksPerUser',
    type: 'int',
    label: 'Max Microtasks per User (0 for no limit)',
    description: 'Maximum number of microtasks per user',
    required: true,
  },

  {
    id: 'startTime',
    type: 'time',
    label: 'Start Time (24h format. leave empty for none)',
    description: 'Strict start time for tasks on each day',
    required: false,
  },

  {
    id: 'endTime',
    type: 'time',
    label: 'End Time (24h format. leave empty for none)',
    description: 'Strict end time for tasks on each day',
    required: false,
  },
];

/**
 * Return the language string for a task record to be displayed in the web app
 */
export function languageString(task: TaskRecordType) {
  return scenarioMap[task.scenario_name].languageString(task);
}

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
  ? TaskRecord<CoreScenarioParamsType & TaskParamsType & PolicyParamsType<PN>>
  : never;

export type TaskType<SN extends ScenarioName = ScenarioName, PN extends PolicyName = PolicyName> = Partial<
  TaskRecordType<SN, PN>
>;

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
