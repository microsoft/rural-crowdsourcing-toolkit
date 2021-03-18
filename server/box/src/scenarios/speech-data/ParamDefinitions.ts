// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Parameter and task type definition for speech data collection scenario

import { TaskRecord } from '../../db/TableInterfaces.auto';
import { ParameterDefinition } from '../common/ParameterTypes';

export const taskParams: ParameterDefinition[] = [
  {
    identifier: 'instruction',
    name: 'Recording Instruction',
    type: 'string',
    description: 'Recording instruction to be shown to the user as a prompt',
    required: true,
  },

  {
    identifier: 'sentenceFile',
    name: 'Sentence JSON File',
    type: 'file',
    description: 'A JSON file containing a single array of sentences',
    required: true,
    max_size: 4096,
    attached: true,
    ext: 'json',
  },

  {
    identifier: 'numRecordings',
    name: 'Number of Recordings',
    type: 'integer',
    description:
      'Number of recordings needed for each sentence in the input corpus',
    required: true,
  },

  {
    identifier: 'creditsPerRecording',
    name: 'Credits for Each Recording',
    type: 'float',
    description:
      'Number of credits to be given for each correctly recorded sentence',
    required: true,
    default: 1.0,
  },

  {
    identifier: 'needVerification',
    name: 'Include verification for recordings',
    type: 'boolean',
    description: 'Flag indicating if the submitted recordings have to verified',
    required: true,
    default: false,
  },
];

export type SpeechDataTask = TaskRecord & {
  params: {
    instruction: string;
    sentenceFile: string;
    numRecordings: number;
    creditsPerRecording: number;
    needVerification: boolean;

    // dynamic params
    verificationTaskId: number;
  };
};
