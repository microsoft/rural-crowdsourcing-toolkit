// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the image annotation validation chain

import { BaseChainInterface } from '../BaseChainInterface';

export const baseImageAnnotationValidation: BaseChainInterface<'IMAGE_ANNOTATION', 'IMAGE_ANNOTATION_VALIDATION'> = {
  name: 'IMAGE_ANNOTATION_VALIDATION',
  full_name: 'Image Annotation Validation',
  fromScenario: 'IMAGE_ANNOTATION',
  toScenario: 'IMAGE_ANNOTATION_VALIDATION',
  blocking: 'EITHER',
  delay: 'EITHER',
  grouping: 'EITHER',
};
