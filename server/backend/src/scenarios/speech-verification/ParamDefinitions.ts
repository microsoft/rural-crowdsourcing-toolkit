// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Parameters for the speech data verification scenario.
 */

import { TaskRecord } from '@karya/db';
import { ParameterDefinition } from '../common/ParameterTypes';

export const taskParams: ParameterDefinition[] = [
  {
    identifier: 'fromSpeechTask',
    name: 'From Speech Data Task',
    type: 'boolean',
    description: 'Flag indicating that the verification is for a speech task',
    required: true,
    default: false,
  },

  {
    identifier: 'speechTaskId',
    name: 'ID of the Speech Task',
    type: 'integer',
    description: 'ID of the speech task whose responses have to be verified',
    required: false,
  },

  {
    identifier: 'numRecordings',
    name: 'Number of recordings',
    type: 'integer',
    description: 'Number of recordings in the task',
    required: false,
  },

  {
    identifier: 'speechDataSet',
    name: 'Speech data set',
    type: 'file',
    description:
      'Speech dataset containing all the recordings and the corresponding transcriptions.',
    required: false,
    max_size: 100000,
    attached: false,
    ext: 'tgz',
  },

  {
    identifier: 'numVerifications',
    name: 'Number of verifications',
    type: 'integer',
    description: 'Number of verifications needed for each recording',
    required: true,
  },

  {
    identifier: 'creditsPerVerification',
    name: 'Credits per verification',
    type: 'float',
    description: 'Number of credits to be given for each verification',
    required: true,
    default: 0.5,
  },
];

export type SpeechVerificationTask = TaskRecord & {
  params: {
    fromSpeechTask: boolean;
    speechTaskId?: string;
    numRecordings?: number;
    speechDataSet?: string;
    numVerifications: number;
    creditsPerVerification: number;
  };
};
