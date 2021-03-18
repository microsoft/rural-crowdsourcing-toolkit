// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the default policy for speech data scenario

import { PolicyParameterDefinition } from '../../../common/ParameterTypes';
import { IPolicy } from '../../../common/PolicyInterface';

export const taskParams: PolicyParameterDefinition[] = [
  {
    identifier: 'numRecordings',
    name: 'Number of recordings',
    type: 'integer',
    description: 'Number of recordings needed for each sentence',
    required: true,
  },
];

export type SpeechDataDefaultPolicyParams = {
  numRecordings: number;
};

export const defaultPolicy: IPolicy = {
  name: 'speech-data-default',
  description:
    'Default policy sets the number of recordings to collect from a box',
  params: { params: taskParams },
};
