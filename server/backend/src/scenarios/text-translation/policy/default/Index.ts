// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the default policy for speech data scenario

import { PolicyParameterDefinition } from '../../../common/ParameterTypes'
import { IPolicy } from '../../../common/PolicyInterface'


export const taskParams: PolicyParameterDefinition[] = [
    {
        identifier: 'numTrans',
        name: 'Number of translations',
        type: 'integer',
        description: 'Number of translations needed for each sentence',
        required: true,
    },
];

export type TextTransDefaultPolicyParams = {
    numRecordings: number;
};
  

export const defaultPolicy: IPolicy = {
    name: 'text-translation-default',
    description:
        'Default policy only sets the number of translations to fetch',
    params: { params: taskParams },
}
