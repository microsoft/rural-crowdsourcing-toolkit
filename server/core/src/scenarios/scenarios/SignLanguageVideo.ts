// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the sign language video data collection

import { TaskRecord } from '../../Index';
import { BaseScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { MicrotaskAssignmentRecord, MicrotaskRecord } from '../../auto/TableInterfaces';
import { MicrotaskInput, MicrotaskOutput } from '../../types/CustomObjects';

// Sign language video data task input parameters
type SignLanguageVideoTaskInputParameters = {
  instruction: string;
  numRecordings: number;
  creditsPerRecording: number;
};

// Sign language video data input format
type SignLanguageVideoMicrotaskInput = { sentence: string };
type SignLanguageVideoMicrotaskInputFiles = {};

// Sign language video data output format
type SignLanguageVideoMicrotaskOutput = {};
type SignLanguageVideoMicrotaskOutputFiles = { recording: string };

// Sign langauge video data task, microtask, microtask assignment types
export type SignLanguageVideoTaskRecord = TaskRecord & { params: SignLanguageVideoTaskInputParameters };
export type SignLanguageVideoMicrotaskRecord = MicrotaskRecord & {
  input: MicrotaskInput<SignLanguageVideoMicrotaskInput, SignLanguageVideoMicrotaskInputFiles>;
  output: MicrotaskOutput<SignLanguageVideoMicrotaskOutput, SignLanguageVideoMicrotaskOutputFiles>;
};
export type SignLanguageVideoAssignmentRecord = MicrotaskAssignmentRecord & {
  output: MicrotaskOutput<SignLanguageVideoMicrotaskOutput, SignLanguageVideoMicrotaskOutputFiles>;
};

// Base sign langauge video data scenario type
export type BaseSignLanguageVideoScenario = BaseScenarioInterface<
  SignLanguageVideoTaskInputParameters,
  SignLanguageVideoMicrotaskInput,
  SignLanguageVideoMicrotaskInputFiles,
  SignLanguageVideoMicrotaskOutput,
  SignLanguageVideoMicrotaskOutputFiles
>;

/**
 * Task parameter input and file formats.
 */
const task_input: BaseSignLanguageVideoScenario['task_input'] = [
  {
    id: 'instruction',
    type: 'string',
    label: 'Recording Instruction',
    description: 'Recording instruction to be shown to the user on the client app',
    required: true,
  },

  {
    id: 'numRecordings',
    type: 'int',
    label: 'Number of Recordings',
    description: 'Number of recordings needed for each sentence in the input corpus',
    required: true,
  },

  {
    id: 'creditsPerRecording',
    type: 'float',
    label: 'Credits for Each Recording',
    description: 'Number of credits to be given to the user for each correctly recorded sentence',
    required: true,
  },
];

// Task input file format for sign language video data task
const task_input_file: BaseSignLanguageVideoScenario['task_input_file'] = {
  json: {
    required: true,
    description: `\
    JSON file containing an array of objects. Each object must have a sentence field that contains the\
    sentence prompt for the recording.\
    `,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string() }).unknown(true)),
  },
  tgz: { required: false },
};

/**
 * Sign language video data scenario implementation
 */
export const baseSignLanguageVideoScenario: BaseSignLanguageVideoScenario = {
  name: 'SIGN_LANGUAGE_VIDEO',
  full_name: 'Sign Language Video Collection',
  description: 'This scenario allows for collection of sign language video data from a text corpus.',
  task_input,
  task_input_file,
  microtask_input: Joi.object({ sentence: Joi.string().required() }),
  microtask_input_files: [],
  microtask_output: Joi.object({}),
  microtask_output_files: ['recording'],
  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'MULTIPLE_SUBJECTIVE',
};
