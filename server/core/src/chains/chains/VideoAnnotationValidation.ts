// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the video annotation validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseVideoAnnotationValidation: BaseChainInterface<'VIDEO_ANNOTATION', 'IMAGE_ANNOTATION_VALIDATION'> = {
  name: 'IMAGE_ANNOTATION_VALIDATION',
  full_name: 'Video Annotation Validation',
  fromScenario: 'VIDEO_ANNOTATION',
  toScenario: 'IMAGE_ANNOTATION_VALIDATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};