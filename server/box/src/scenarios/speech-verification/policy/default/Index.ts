// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Default policy definition for speech verification
 */

import { IPolicy } from '../../../common/PolicyInterface';
import {
  getAssignableMicrotaskGroups,
  getAssignableMicrotasks,
} from './GetAssignments';
import {
  handleMicrotaskAssignmentCompletion,
  handleMicrotaskGroupAssignmentCompletion,
} from './HandleAssignmentCompletion';

export type SpeechVerificationDefaultPolicyParams = {
  numVerifications: number;
};

export const defaultPolicy: IPolicy = {
  name: 'speech-verification-default',
  getAssignableMicrotasks,
  getAssignableMicrotaskGroups,
  handleMicrotaskAssignmentCompletion,
  handleMicrotaskGroupAssignmentCompletion,
};
