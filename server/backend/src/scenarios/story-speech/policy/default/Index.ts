// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the story-speech scenario and related task types
// Parameter and task type definitions for the story-speech scenario

import { PolicyParameterDefinition } from '../../../common/ParameterTypes';
import { IPolicy } from '../../../common/PolicyInterface';

export const taskParams: PolicyParameterDefinition[] = [
  {
    identifier: 'numRecordings',
    name: 'Number of recordings',
    type: 'integer',
    description: 'Number of recordings needed for each story',
    required: true,
  },
];

export type StorySpeechDefaultPolicyParams = {
  numRecordings: number;
};

export const defaultPolicy: IPolicy = {
  name: 'story-speech-default',
  description:
    'Default policy only sets the number of number of recordings to fetch',
  params: { params: taskParams },
};
