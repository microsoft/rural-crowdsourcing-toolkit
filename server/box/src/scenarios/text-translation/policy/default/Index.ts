// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the text-translation scenario and related task types
// Parameter and task type definitions for the text-translation scenario

import { IPolicy } from '../../../common/PolicyInterface';
import {
    getAssignableMicrotaskGroups,
    getAssignableMicrotasks,
  } from './GetAssignments';
  import {
    handleMicrotaskAssignmentCompletion,
    handleMicrotaskGroupAssignmentCompletion,
  } from './HandleAssignmentCompletion';

export type TextTranslationDefaultPolicyParams = {
    numRecordings: number;
};

export const defaultPolicy: IPolicy = {
    name: 'text-translation-default',
    getAssignableMicrotasks,
    getAssignableMicrotaskGroups,
    handleMicrotaskAssignmentCompletion,
    handleMicrotaskGroupAssignmentCompletion,
  };
  