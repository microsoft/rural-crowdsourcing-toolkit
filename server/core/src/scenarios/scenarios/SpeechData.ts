// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the speech-data scenario

import { TaskRecord } from '../../Index';
import { ScenarioInterface } from '../ScenarioInterface';
import Joi from 'joi';
import { ParameterDefinition } from '@karya/parameter-specs';

/**
 * Task parameter input and file formats.
 */
const task_input: ParameterDefinition[] = [
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

export type SpeechDataTaskInputParameters = {
  instruction: string;
  numRecordings: number;
  creditsPerRecording: number;
};

// Task input file format for speech data task
const task_input_file: ScenarioInterface['task_input_file'] = {
  json: {
    required: true,
    description: `\
    JSON file containing an array of objects. Each object must have a sentence field that contains the\
    sentence prompt for the recording.\
    `,
    schema: Joi.array().items(Joi.object({ sentence: Joi.string() })),
  },
  tgz: { required: false },
};

// Microtask input format
const microtask_input = Joi.object({ sentence: Joi.string() });
const microtask_input_files: string[] = [];

export type SpeechDataMicrotaskInput = { sentence: string };
export type SpeechDataMicrotaskInputFiles = {};

// Microtask output format
const microtask_output = Joi.object({});
const microtask_output_files = ['recording'];

export type SpeechDataMicrotaskOutput = {};
export type SpeechDataMicrotaskOutputFiles = { recording: string };

// Speech data task type
export type SpeechDataTaskRecord = TaskRecord & { params: SpeechDataTaskInputParameters };

/**
 * Speech data scenario implementation
 */
export const SpeechDataScenario: ScenarioInterface = {
  name: 'speech-data',
  full_name: 'Speech Data Collection',
  description: 'This scenario allows for collection of speech data from a text corpus.',
  task_input,
  task_input_file,
  microtask_input,
  microtask_input_files,
  microtask_output,
  microtask_output_files,
  assignment_granularity: 'microtask',
  group_assignment_order: 'either',
  microtask_assignment_order: 'either',
  response_type: 'multiple-subjective',
};
