// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
//
// Base implementation of the Video labelling scenario

import Joi from 'joi';
import { BaseScenarioInterface } from '../ScenarioInterface';

// Video transcription task input parameters
type VideoAnnotationTaskInputParameters = {
  labels: string[];
  rememberAnnotationState: boolean;
  moveAnnotation: boolean;
};

// Video transcription microtask input/output format
type VideoAnnotationMicrotaskInputFiles = { image: string };
type VideoAnnotationMicrotaskOutput = { labels: any[] };

// Base Video transcription scenario type
export type BaseVideoAnnotationScenario = BaseScenarioInterface<
  'VIDEO_ANNOTATION',
  VideoAnnotationTaskInputParameters,
  {},
  VideoAnnotationMicrotaskInputFiles,
  VideoAnnotationMicrotaskOutput,
  {}
>;

// Base Video transcription scenario
export const baseVideoAnnotationScenario: BaseVideoAnnotationScenario = {
  name: 'VIDEO_ANNOTATION',
  full_name: 'Video Annotation',
  description: 'This scenario allows users to tag Videos with a set of labels',

  task_input: [
    {
      id: 'labels',
      type: 'list',
      label: 'Label List',
      description: 'List of labels to be attached to the Videos',
      required: true,
    },
    {
      id: 'rememberAnnotationState',
      type: 'boolean',
      label: 'Remember Annotation State',
      description: 'Remember the state of the previous annotation',
      required: false,
    },
    {
      id: 'moveAnnotation',
      type: 'boolean',
      label: 'Move Annotations',
      description: 'Allow movement of annotations relative to the figure',
      required: false,
    },
  ],

  task_input_file: {
    json: {
      required: true,
      description: `JSON file containing an array of objects. Each object must have an Video key with the name of the Video file, annotationType key with type of annotation object (RECTANGLE or POLYGON) and numberOfSides key for the number of sides`,
      schema: Joi.array().items(
        Joi.object({
          Video: Joi.string().required(),
          annotationType: Joi.string().required(),
          numberOfSides: Joi.number().required(),
        }).unknown(true)
      ),
    },
    tgz: {
      required: true,
      description: 'Tar ball containing all the Videos referenced in the json input',
    },
  },

  microtask_input: Joi.object({}),
  microtask_input_files: ['image'],
  microtask_output: Joi.object({ transcription: Joi.string().required() }),
  microtask_output_files: [],

  assignment_granularity: 'GROUP',
  group_assignment_order: 'EITHER',
  microtask_assignment_order: 'SEQUENTIAL',
  response_type: 'UNIQUE',

  languageString(task) {
    return 'N/A';
  },
};
