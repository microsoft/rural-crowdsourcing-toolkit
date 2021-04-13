// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Budget estimator function for the story-speech scenario. For this scenario,
// the cost is constant per recording. This parameter is provided as part of the
// autoBudgetParams. The function assumes that the task is already validated.

import * as BlobStore from '@karya/blobstore';
import { BudgetEstimatorResponse } from '../common/ScenarioInterface';
import { StorySpeechTask } from './ParamDefinitions';

export async function estimateTaskBudget(task: StorySpeechTask): Promise<BudgetEstimatorResponse> {
  try {
    // extract parameters
    const { sentenceFile, numRecordings, creditsPerRecording } = task.params;

    // budget = numSentences * numRecording * creditPerRecoding
    // read the sentence file and parse the stories
    const sentenceFileData = await BlobStore.downloadBlobAsText(sentenceFile);
    const stories: string[][] = JSON.parse(sentenceFileData);

    let numSentences = 0;
    for (const story of stories) {
      numSentences += story.length;
    }
    return {
      success: true,
      budget: numSentences * numRecordings * creditsPerRecording,
    };
  } catch (e) {
    return {
      success: false,
      budget: null,
      message: 'Error while estimating budget',
    };
  }
}
