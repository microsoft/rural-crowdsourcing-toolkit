// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Budget estimator function for the speech-data scenario. For this scenario,
// the cost is constant per recording. This parameter is provided as part of the
// autoBudgetParams. The function assumes that the task is already validated.

import * as BlobStore from '../../utils/AzureBlob';
import { BudgetEstimatorResponse } from '../common/ScenarioInterface';
import { TextTranslationTask } from './ParamDefinitions';

export async function estimateTaskBudget(
    task: TextTranslationTask,
  ): Promise<BudgetEstimatorResponse> {
    try {
      // extract parameters
      const {
        sentenceFile,
        numTranslations,
        creditsPerTranslation,
        needVerification,
      } = task.params;
  
      // budget = numSentences * numRecording * creditPerRecoding
      // read the sentence file and parse the stories
      const sentenceFileData = await BlobStore.downloadBlobAsText(sentenceFile);
      const sentences: string[] = JSON.parse(sentenceFileData);
      const numSentences = sentences.length;
  
      // If verification is needed, add the budget for that as well
      // TODO: This needs to be parameterized
      const creditsPerVerification = needVerification ? 0.5 : 0.0;
  
      return {
        success: true,
        budget:
          numSentences *
          numTranslations *
          (creditsPerTranslation + creditsPerVerification),
      };
    } catch (e) {
      return {
        success: false,
        budget: null,
        message: 'Error while estimating budget',
      };
    }
  }
  