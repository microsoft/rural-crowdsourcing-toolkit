// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Microtask generator for the story-speech scenario. Each story in the task is
// assigned a single microtask group, and each part within a story is assigned
// to a single microtask. The function assumes that the task has already been
// validated.

import { Microtask, MicrotaskGroup } from '../../db/TableInterfaces.auto';
import * as BlobStore from '../../utils/AzureBlob';
import { MicrotaskGeneratorResponse } from '../common/ScenarioInterface';
import { StorySpeechTask } from './ParamDefinitions';

export async function generateMicrotasks(
  task: StorySpeechTask,
): Promise<MicrotaskGeneratorResponse> {
  try {
    const { sentenceFile, creditsPerRecording } = task.params;
    const sentenceFileData = await BlobStore.downloadBlobAsText(sentenceFile);
    const stories: string[][] = JSON.parse(sentenceFileData);

    const microtaskGroups = stories.map(story => {
      // group info
      const mg_info: MicrotaskGroup = {
        task_id: task.id,
        microtask_assignment_order: task.microtask_assignment_order,
        status: 'incomplete',
      };

      const microtasks = story.map(sentence => {
        const m_info: Microtask = {
          task_id: task.id,
          input: { data: sentence },
          deadline: task.deadline,
          credits: creditsPerRecording,
          status: 'incomplete',
        };

        return { m_info };
      });

      return { mg_info, microtasks };
    });

    return { success: true, microtaskGroups };
  } catch (e) {
    return {
      success: false,
      message: 'Unknown error while generating microtasks',
    };
  }
}
