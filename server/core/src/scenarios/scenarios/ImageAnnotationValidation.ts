// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of image annotation validation scenario.
// Rate each annotation as good, okay, or bad.

import Joi from 'joi';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Image transcription task input parameters
type ImageAnnotationValidationTaskInputParameters = {};

// Image transcription microtask input/output format
type ImageAnnotationRating = 'GOOD' | 'OKAY' | 'BAD';
type ImageAnnotationValidationMicrotaskInputFiles = { image: string };
type ImageAnnotationValidationMicrotaskOutput = { rating: ImageAnnotationRating[] };

// Base image transcription scenario type
export type BaseImageAnnotationValidationScenario = BaseScenarioInterface<
  'IMAGE_ANNOTATION_VALIDATION',
  ImageAnnotationValidationTaskInputParameters,
  {},
  ImageAnnotationValidationMicrotaskInputFiles,
  ImageAnnotationValidationMicrotaskOutput,
  {}
>;

// Base image transcription scenario
export const baseImageAnnotationValidationScenario: BaseImageAnnotationValidationScenario = {
  name: 'IMAGE_ANNOTATION_VALIDATION',
  full_name: 'Image Annotation Validation',
  description: 'Validate a set of annotations as good/okay/bad',

  task_input: [],

  task_input_file: {
    json: {
      required: true,
      description: `Contains a set of images with their annotations`,
      schema: Joi.array().items(
        Joi.object({
          image: Joi.string().required(),
          annotations: Joi.array().items(Joi.object().unknown(true)),
        }).unknown(true)
      ),
    },
    tgz: {
      required: true,
      description: 'Tar ball containing all the images referenced in the json input',
    },
  },

  microtask_input: Joi.object({}),
  microtask_input_files: ['image'],
  microtask_output: Joi.object({ transcription: Joi.string().required() }),
  microtask_output_files: [],

  assignment_granularity: 'MICROTASK',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'EITHER',
  response_type: 'UNIQUE',

  languageString(task) {
    return 'N/A';
  },
};
