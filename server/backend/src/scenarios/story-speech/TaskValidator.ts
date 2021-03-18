// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Task validator function for story-speech scenario. A valid task is
// accompanied with a sentence file which is a doubly nested array. The first
// level array is a list of stories. Each story is a list of sentences. Each
// sentence is a string.

import * as BlobStore from '../../utils/AzureBlob';
import { TaskValidatorResponse } from '../common/ScenarioInterface';
import { StorySpeechTask } from './ParamDefinitions';

export async function validateTask(
  task: StorySpeechTask,
): Promise<TaskValidatorResponse> {
  let sentenceFileData: string;

  // Read the sentence file
  try {
    sentenceFileData = await BlobStore.downloadBlobAsText(
      task.params.sentenceFile,
    );
  } catch (e) {
    return {
      success: false,
      message: ['Could not read blob file'],
    };
  }

  let stories: any;

  // Parse the sentence file into JSON
  try {
    stories = JSON.parse(sentenceFileData);
  } catch (e) {
    return {
      success: false,
      message: ['Input stories file is not a valid JSON'],
    };
  }

  // Check if the stories format is valid
  const errors: string[] = [];
  // check if the JSON object is an array of stories
  if (stories instanceof Array) {
    for (const story of stories) {
      if (story instanceof Array) {
        for (const sentence of story) {
          if (typeof sentence !== 'string') {
            errors.push(`'${JSON.stringify(sentence)}' is not a string`);
          }
        }
      } else {
        errors.push('Each story should be an array of sentences');
      }
    }
  } else {
    errors.push('JSON file should be an array of stories');
  }

  if (errors.length > 0) {
    return { success: false, message: errors };
  }

  // JSON object is fine. Return true status
  return { success: true };
}
