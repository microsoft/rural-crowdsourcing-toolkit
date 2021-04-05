// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Parameter and task type definitions for the story-speech scenario

import { TaskRecord } from '@karya/db';
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
    name: 'Stories JSON File',
    type: 'file',
    description:
      'A JSON file of stories. The root object is an array of stories. Each story is an array of parts. Each part is an array of sentences.',
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
      'Number of recordings needed for each sentence in the input stories corpus',
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
];

export type StorySpeechTask = TaskRecord & {
  params: {
    instruction: string;
    sentenceFile: string;
    numRecordings: number;
    creditsPerRecording: number;
  };
};
