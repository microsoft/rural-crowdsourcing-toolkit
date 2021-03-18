// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Definition of the story-speech scenario and related task types
// Parameter and task type definitions for the story-speech scenario

import { IPolicy } from '../../../common/PolicyInterface';
import {
  getAssignableMicrotaskGroups,
  getAssignableMicrotasks,
} from './GetAssignments';
import {
  handleMicrotaskAssignmentCompletion,
  handleMicrotaskGroupAssignmentCompletion,
} from './HandleAssignmentCompletion';

export type StorySpeechDefaultPolicyParams = {
  numRecordings: number;
};

export const defaultPolicy: IPolicy = {
  name: 'story-speech-default',
  getAssignableMicrotasks,
  getAssignableMicrotaskGroups,
  handleMicrotaskAssignmentCompletion,
  handleMicrotaskGroupAssignmentCompletion,
};
