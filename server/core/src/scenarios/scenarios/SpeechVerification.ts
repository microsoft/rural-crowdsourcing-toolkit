// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the speech-verification scenario

import { TaskRecord } from '../../Index';
import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { MicrotaskAssignmentRecord, MicrotaskRecord } from '../../auto/TableInterfaces';
import { MicrotaskInput, MicrotaskOutput } from '../../types/CustomObjects';

// Speech verification task input parameters
type SpeechVerificationTaskInputParameters = {
  instruction: string;
  numVerifications: number;
  creditsPerVerification: number;
};

// Speech verification microtask input format
type SpeechVerificationMicrotaskInput = { sentence: string };
type SpeechVerificationMicrotaskInputFiles = { recording: string };

// Speech verificaion microtask output format
type SpeechVerificationMicrotaskOutput = {
  accuracy: number;
  quality: number;
  volume: number;
};
type SpeechVerificationMicrotaskOutputFiles = {};

// Speech verification task, microtask, assignment record types
export type SpeechVerificationTaskRecord = TaskRecord & { params: SpeechVerificationTaskInputParameters };
export type SpeechVerificationMicrotaskRecord = MicrotaskRecord & {
  input: MicrotaskInput<SpeechVerificationMicrotaskInput, SpeechVerificationMicrotaskInputFiles>;
  output: MicrotaskOutput<SpeechVerificationMicrotaskOutput, SpeechVerificationMicrotaskOutputFiles>;
};
export type SpeechVerificationAssignmentRecord = MicrotaskAssignmentRecord & {
  output: MicrotaskOutput<SpeechVerificationMicrotaskOutput, SpeechVerificationMicrotaskOutputFiles>;
};

// Base speech verification scenario type
export type BaseSpeechVerificationScenario = BaseScenarioInterface<
  SpeechVerificationTaskInputParameters,
  SpeechVerificationMicrotaskInput,
  SpeechVerificationMicrotaskInputFiles,
  SpeechVerificationMicrotaskOutput,
  SpeechVerificationMicrotaskOutputFiles
>;

// Speech verification task inputs
const task_input: BaseSpeechVerificationScenario['task_input'] = [
  {
    id: 'instruction',
    type: 'string',
    label: 'Verification Instruction',
    description: 'Verification instruction to be shown to the user on the client app',
    required: true,
  },

  {
    id: 'numVerifications',
    type: 'int',
    label: 'Number of Verifications',
    description: 'Number of verifications needed for each sentence/recording pair in the input corpus',
    required: true,
  },

  {
    id: 'creditsPerVerification',
    type: 'float',
    label: 'Credits for Each Verification',
    description: 'Number of credits to be given to the user for each correct verification',
    required: true,
  },
];

// Task input file format for speech verification
const task_input_file: BaseSpeechVerificationScenario['task_input_file'] = {
  json: {
    required: true,
    description: `JSON file containing an array of objects. Each object must have a sentence field that contains the sentence prompt and a recording field that contains the name of the recording file`,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string().required(), recording: Joi.string().required() })),
  },
  tgz: {
    required: true,
    description: `Tar ball containing all the recordings with the names matching those provided in the JSON file`,
  },
};

// Base speech verification scenario
export const baseSpeechVerificationScenario: BaseSpeechVerificationScenario = {
  name: 'SPEECH_VERIFICATION',
  full_name: 'Speech Verification',
  description: 'This scenario allows users to verify an audio recording against a sentence and rate its quality',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string().required() }).unknown(true),
  microtask_input_files: ['recording'],
  microtask_output: Joi.object({
    accuracy: Joi.number().required(),
    quality: Joi.number().required(),
    volume: Joi.number().required(),
  }),
  microtask_output_files: [],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',
};
