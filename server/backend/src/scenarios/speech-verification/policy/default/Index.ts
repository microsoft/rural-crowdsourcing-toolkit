// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the story-speech scenario and related task types
// Parameter and task type definitions for the story-speech scenario

import { PolicyParameterDefinition } from '../../../common/ParameterTypes';
import { IPolicy } from '../../../common/PolicyInterface';

export const taskParams: PolicyParameterDefinition[] = [
  {
    identifier: 'numVerifications',
    name: 'Number of verifications',
    type: 'integer',
    description: 'Number of verifications needed for each story',
    required: true,
  },
];

export const defaultPolicy: IPolicy = {
  name: 'speech-verification-default',
  description: 'Default policy for speech verification',
  params: { params: taskParams },
};
