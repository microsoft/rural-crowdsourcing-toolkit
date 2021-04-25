// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Implementation of the speech-data scenario

import { MicrotaskList, ScenarioInterface } from '../ScenarioInterface';
import { TaskRecord, Microtask } from '../../db/Index';
import Joi from 'joi';

/**
 * Task parameter input and file formats.
 */
const task_input = Joi.object({
  instruction: Joi.string()
    .label('Recording Instruction')
    .description('Recording instruction to be shown to the user as a prompt')
    .required(),
  numRecordings: Joi.number()
    .label('Number of Recordings')
    .description('Number of recordings needed for each sentence in the input corpus')
    .integer()
    .min(1)
    .required(),
  creditsPerRecording: Joi.number()
    .positive()
    .label('Credits for Each Recording')
    .description('Number of credits to be given for each correctly recorded sentence')
    .required(),
});

type SpeechDataTaskInputParameters = {
  instruction: string;
  numRecordings: number;
  creditsPerRecording: number;
};

// Task input file format for speech data task
const task_input_file: ScenarioInterface['task_input_file'] = {
  json: {
    required: true,
    schema: Joi.array().items(Joi.string()),
  },
  tar: { required: false },
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
export type SpeechDataTask = TaskRecord & { params: SpeechDataTaskInputParameters };

/**
 * Process the input file for the speech data task.
 * @param task Speech data task record
 * @param jsonFilePath Path to JSON file
 * @param tarFilePath --
 * @param task_folder Task folder path
 */
async function processInputFile(
  task: SpeechDataTask,
  jsonData?: any,
  tarFilePath?: string,
  task_folder?: string
): Promise<MicrotaskList> {
  const sentences: string[] = jsonData!!;
  const microtasks = sentences.map((sentence) => {
    const mt: Microtask = {
      task_id: task.id,
      input: { data: { sentence } },
      deadline: task.deadline,
      credits: task.params.creditsPerRecording,
      status: 'incomplete',
    };
    return { mt };
  });

  return { groups: [{ mg: null, microtasks }] };
}

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
  processInputFile,
};
