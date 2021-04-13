// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Task validator function for speech-data scenario. A valid task is
// accompanied with a sentence array.

import * as BlobStore from '@karya/blobstore';
import { TaskValidatorResponse } from '../common/ScenarioInterface';
import { SpeechDataTask } from './ParamDefinitions';

export async function validateTask(task: SpeechDataTask): Promise<TaskValidatorResponse> {
  let sentenceFileData: string;

  // Read the sentence file
  try {
    sentenceFileData = await BlobStore.downloadBlobAsText(task.params.sentenceFile);
  } catch (e) {
    return {
      success: false,
      message: ['Could not read blob file'],
    };
  }

  let sentences: any;

  // Parse the sentence file into JSON
  try {
    sentences = JSON.parse(sentenceFileData);
  } catch (e) {
    return {
      success: false,
      message: ['Input stories file is not a valid JSON'],
    };
  }

  // Check if the sentences format is valid
  const errors: string[] = [];

  if (sentences instanceof Array) {
    for (const sentence of sentences) {
      if (typeof sentence !== 'string') {
        errors.push(`'${JSON.stringify(sentence)}' is not a string`);
      }
    }
  } else {
    errors.push('JSON file should be an array of sentences');
  }

  if (errors.length > 0) {
    return { success: false, message: errors };
  }

  // JSON object is fine. Return true status
  return { success: true };
}
